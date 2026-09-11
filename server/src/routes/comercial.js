import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const isAdmin = u => u.rol === "Administrador";

function audit(req, accion, detalle, empresaId=req.user.empresa_id) {
  db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(empresaId, req.user.id, accion, "FLUJO_COMERCIAL", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent") || "");
}

r.get("/flujo", requireAuth, requirePermission("cotizaciones.ver"), (req,res) => {
  const empresa = isAdmin(req.user) && Number(req.query.empresa_id) ? Number(req.query.empresa_id) : req.user.empresa_id;
  const q = String(req.query.q || "").trim();
  const params = [empresa];
  let where = "WHERE p.empresa_id=? AND p.estado=1 AND p.convertido_cliente_id IS NULL";
  if (q) { where += " AND (p.nombre LIKE ? OR p.nit LIKE ? OR p.contacto LIKE ? OR p.correo LIKE ?)"; const x=`%${q}%`; params.push(x,x,x,x); }
  const prospectos = db.prepare(`SELECT p.id,p.codigo,p.nombre,p.etapa,p.proxima_gestion,p.responsable_id,
    (SELECT q.codigo FROM cotizaciones q WHERE q.prospecto_id=p.id ORDER BY q.id DESC LIMIT 1) cotizacion_codigo,
    (SELECT q.estado FROM cotizaciones q WHERE q.prospecto_id=p.id ORDER BY q.id DESC LIMIT 1) cotizacion_estado
    FROM prospectos p ${where} ORDER BY p.fecha_actualizacion DESC,p.id DESC LIMIT 100`).all(...params);

  const clientes = db.prepare(`SELECT c.id,c.codigo,c.nombre,c.razon_social,c.nombre_comercial,
    (SELECT q.id FROM cotizaciones q WHERE q.cliente_id=c.id AND q.estado='Aceptada' ORDER BY q.id DESC LIMIT 1) cotizacion_aceptada_id,
    (SELECT q.codigo FROM cotizaciones q WHERE q.cliente_id=c.id AND q.estado='Aceptada' ORDER BY q.id DESC LIMIT 1) cotizacion_aceptada,
    (SELECT ct.id FROM contratos ct WHERE ct.cliente_id=c.id AND ct.estado IN ('Borrador','Activo') ORDER BY ct.id DESC LIMIT 1) contrato_id,
    (SELECT ct.codigo FROM contratos ct WHERE ct.cliente_id=c.id AND ct.estado IN ('Borrador','Activo') ORDER BY ct.id DESC LIMIT 1) contrato_codigo,
    (SELECT s.id FROM suscripciones s WHERE s.cliente_id=c.id AND s.estado='Activa' ORDER BY s.id DESC LIMIT 1) suscripcion_id,
    (SELECT s.codigo FROM suscripciones s WHERE s.cliente_id=c.id AND s.estado='Activa' ORDER BY s.id DESC LIMIT 1) suscripcion_codigo,
    (SELECT f.id FROM facturas f WHERE f.cliente_id=c.id AND f.estado IN ('Borrador','Emitida','Vencida') ORDER BY f.id DESC LIMIT 1) factura_id,
    (SELECT f.codigo FROM facturas f WHERE f.cliente_id=c.id AND f.estado IN ('Borrador','Emitida','Vencida') ORDER BY f.id DESC LIMIT 1) factura_codigo,
    (SELECT COALESCE(SUM(pc.valor),0) FROM pagos_cartera pc JOIN facturas f2 ON f2.id=pc.factura_id WHERE f2.cliente_id=c.id AND pc.estado='Aplicado') pagos
    FROM clientes c WHERE c.empresa_id=? AND c.estado=1 ORDER BY c.fecha_actualizacion DESC,c.id DESC LIMIT 200`).all(empresa);

  const counts = {
    prospectos: db.prepare("SELECT COUNT(*) n FROM prospectos WHERE empresa_id=? AND estado=1 AND convertido_cliente_id IS NULL").get(empresa).n,
    cotizaciones: db.prepare("SELECT COUNT(*) n FROM cotizaciones WHERE empresa_id=?").get(empresa).n,
    cotizaciones_aceptadas: db.prepare("SELECT COUNT(*) n FROM cotizaciones WHERE empresa_id=? AND estado='Aceptada'").get(empresa).n,
    clientes: db.prepare("SELECT COUNT(*) n FROM clientes WHERE empresa_id=? AND estado=1").get(empresa).n,
    contratos_activos: db.prepare("SELECT COUNT(*) n FROM contratos WHERE empresa_id=? AND estado='Activo'").get(empresa).n,
    suscripciones_activas: db.prepare("SELECT COUNT(*) n FROM suscripciones WHERE empresa_id=? AND estado='Activa'").get(empresa).n,
    facturas_pendientes: db.prepare("SELECT COUNT(*) n FROM facturas WHERE empresa_id=? AND estado IN ('Borrador','Emitida','Vencida')").get(empresa).n
  };

  audit(req,"CONSULTAR","Consultó el flujo comercial",empresa);
  res.json({empresa_id:empresa,counts,prospectos,clientes});
});

export default r;
