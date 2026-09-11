import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { currentMonthRange, todayISO, SYSTEM_TIME_ZONE } from "../utils/date.js";
import { financialIntegrityReport } from "../utils/financialIntegrity.js";

const r = Router();
const isAdmin = (u) => u.rol === "Administrador";

function selectedCompany(req) {
  if (!isAdmin(req.user)) return Number(req.user.empresa_id);
  const id = Number(req.query.empresa_id || 0);
  return id > 0 ? id : null;
}

function dateRange(req) {
  const { desde: first, hasta: last } = currentMonthRange();
  const valid = (x) => /^\d{4}-\d{2}-\d{2}$/.test(String(x || ""));
  const desde = valid(req.query.desde) ? String(req.query.desde) : first;
  const hasta = valid(req.query.hasta) ? String(req.query.hasta) : last;
  return desde <= hasta ? { desde, hasta } : { desde: hasta, hasta: desde };
}

function whereCompany(alias, empresa) {
  return empresa ? { sql: ` AND ${alias}.empresa_id=?`, params: [empresa] } : { sql: "", params: [] };
}

r.get("/integridad", requireAuth, requirePermission("financiero.ver"), (req, res) => {
  const empresa = selectedCompany(req);
  res.json(financialIntegrityReport(empresa));
});

r.get("/", requireAuth, requirePermission("financiero.ver"), (req, res) => {
  const empresa = selectedCompany(req);
  const { desde, hasta } = dateRange(req);
  const wcF = whereCompany("f", empresa);
  const wcP = whereCompany("p", empresa);

  const facturado = db.prepare(`SELECT COALESCE(SUM(f.total),0) total, COUNT(*) cantidad
    FROM facturas f
    WHERE f.estado NOT IN ('Borrador','Anulada') AND f.fecha_emision BETWEEN ? AND ?${wcF.sql}`).get(desde, hasta, ...wcF.params);

  const cobrado = db.prepare(`SELECT COALESCE(SUM(p.valor),0) total, COUNT(*) cantidad
    FROM pagos_cartera p
    WHERE p.estado='Aplicado' AND p.fecha_pago BETWEEN ? AND ?${wcP.sql}`).get(desde, hasta, ...wcP.params);

  const hoy = todayISO();

  const cartera = db.prepare(`SELECT
      COALESCE(SUM(CASE WHEN saldo > 0 THEN saldo ELSE 0 END),0) por_cobrar,
      COALESCE(SUM(CASE WHEN saldo > 0 AND fecha_vencimiento <> '' AND fecha_vencimiento < ? THEN saldo ELSE 0 END),0) vencido,
      COALESCE(SUM(CASE WHEN saldo > 0 AND (fecha_vencimiento='' OR fecha_vencimiento >= ?) THEN saldo ELSE 0 END),0) por_vencer,
      COUNT(DISTINCT CASE WHEN saldo > 0 THEN cliente_id END) clientes_con_saldo
    FROM (
      SELECT f.id,f.cliente_id,f.fecha_vencimiento,f.total-COALESCE((SELECT SUM(p2.valor) FROM pagos_cartera p2 WHERE p2.factura_id=f.id AND p2.estado='Aplicado'),0) saldo
      FROM facturas f
      WHERE f.estado NOT IN ('Borrador','Anulada')${wcF.sql}
    )`).get(hoy, hoy, ...wcF.params);

  const estados = db.prepare(`SELECT
      SUM(CASE WHEN f.estado='Emitida' THEN 1 ELSE 0 END) emitidas,
      SUM(CASE WHEN f.estado='Pagada' THEN 1 ELSE 0 END) pagadas,
      SUM(CASE WHEN f.estado='Vencida' THEN 1 ELSE 0 END) vencidas,
      SUM(CASE WHEN f.estado='Anulada' THEN 1 ELSE 0 END) anuladas,
      COUNT(*) total
    FROM facturas f WHERE f.fecha_emision BETWEEN ? AND ?${wcF.sql}`).get(desde, hasta, ...wcF.params);

  const aging = db.prepare(`SELECT bucket, COALESCE(SUM(saldo),0) total, COUNT(*) cantidad FROM (
      SELECT CASE
        WHEN saldo<=0 THEN 'Pagada'
        WHEN fecha_vencimiento='' OR fecha_vencimiento>=? THEN 'Por vencer'
        WHEN julianday(?)-julianday(fecha_vencimiento) BETWEEN 1 AND 30 THEN '0–30 días'
        WHEN julianday(?)-julianday(fecha_vencimiento) BETWEEN 31 AND 60 THEN '31–60 días'
        WHEN julianday(?)-julianday(fecha_vencimiento) BETWEEN 61 AND 90 THEN '61–90 días'
        ELSE '+90 días' END bucket, saldo
      FROM (SELECT f.fecha_vencimiento, f.total-COALESCE((SELECT SUM(p2.valor) FROM pagos_cartera p2 WHERE p2.factura_id=f.id AND p2.estado='Aplicado'),0) saldo
        FROM facturas f WHERE f.estado NOT IN ('Borrador','Anulada')${wcF.sql})
    ) WHERE bucket<>'Pagada' GROUP BY bucket`).all(hoy, hoy, hoy, hoy, ...wcF.params);

  const recaudo = db.prepare(`SELECT p.fecha_pago fecha, COALESCE(SUM(p.valor),0) total, COUNT(*) cantidad
    FROM pagos_cartera p WHERE p.estado='Aplicado' AND p.fecha_pago BETWEEN ? AND ?${wcP.sql}
    GROUP BY p.fecha_pago ORDER BY p.fecha_pago ASC`).all(desde, hasta, ...wcP.params);

  const recent = db.prepare(`SELECT p.id,p.fecha_pago,p.valor,p.medio_pago,p.referencia, f.codigo factura, COALESCE(c.razon_social,c.nombre_comercial,c.nombre) cliente
    FROM pagos_cartera p JOIN facturas f ON f.id=p.factura_id JOIN clientes c ON c.id=p.cliente_id
    WHERE p.estado='Aplicado'${wcP.sql}
    ORDER BY p.fecha_pago DESC,p.id DESC LIMIT 10`).all(...wcP.params);

  const debtors = db.prepare(`SELECT c.id, COALESCE(c.razon_social,c.nombre_comercial,c.nombre) cliente,
      COUNT(*) facturas, COALESCE(SUM(CASE WHEN f.total-COALESCE(p.pagado,0)>0 THEN f.total-COALESCE(p.pagado,0) ELSE 0 END),0) saldo
    FROM facturas f
    JOIN clientes c ON c.id=f.cliente_id
    LEFT JOIN (SELECT factura_id,SUM(valor) pagado FROM pagos_cartera WHERE estado='Aplicado' GROUP BY factura_id) p ON p.factura_id=f.id
    WHERE f.estado NOT IN ('Borrador','Anulada')${wcF.sql}
    GROUP BY c.id, COALESCE(c.razon_social,c.nombre_comercial,c.nombre)
    HAVING COALESCE(SUM(CASE WHEN f.total-COALESCE(p.pagado,0)>0 THEN f.total-COALESCE(p.pagado,0) ELSE 0 END),0)>0
    ORDER BY saldo DESC LIMIT 8`).all(...wcF.params);

  const facturasPromedio = Number(facturado.cantidad || 0) > 0 ? Number(facturado.total || 0) / Number(facturado.cantidad || 0) : 0;
  const recaudoPct = Number(facturado.total || 0) > 0 ? Number(cobrado.total || 0) / Number(facturado.total || 0) * 100 : 0;
  const vencidoPct = Number(cartera.por_cobrar || 0) > 0 ? Number(cartera.vencido || 0) / Number(cartera.por_cobrar || 0) * 100 : 0;

  res.json({
    periodo: { desde, hasta },
    empresa_id: empresa,
    resumen: {
      facturado: Number(facturado.total || 0), facturas_emitidas: Number(facturado.cantidad || 0),
      cobrado: Number(cobrado.total || 0), pagos: Number(cobrado.cantidad || 0),
      por_cobrar: Number(cartera.por_cobrar || 0), vencido: Number(cartera.vencido || 0),
      por_vencer: Number(cartera.por_vencer || 0), clientes_con_saldo: Number(cartera.clientes_con_saldo || 0)
    },
    estados: { emitidas:Number(estados.emitidas||0), pagadas:Number(estados.pagadas||0), vencidas:Number(estados.vencidas||0), anuladas:Number(estados.anuladas||0), total:Number(estados.total||0) },
    aging, recaudo, pagos_recientes: recent, clientes_mayor_saldo: debtors,
    indicadores: { factura_promedio: facturasPromedio, recaudo_pct: recaudoPct, vencido_pct: vencidoPct },
    zona_horaria: SYSTEM_TIME_ZONE,
    fecha_operativa: hoy
  });
});

export default r;
