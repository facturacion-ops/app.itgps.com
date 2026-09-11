import { db } from "../db/database.js";

export function invoiceIntegrity(id) {
  return db.prepare(`
    SELECT f.id, f.empresa_id, f.cliente_id,
      CASE WHEN c.id IS NULL THEN 0 WHEN c.empresa_id=f.empresa_id THEN 1 ELSE 0 END AS cliente_empresa_ok
    FROM facturas f
    LEFT JOIN clientes c ON c.id=f.cliente_id
    WHERE f.id=?
  `).get(Number(id));
}

export function assertInvoiceIntegrity(id) {
  const row = invoiceIntegrity(id);
  if (!row) throw new Error("La factura no existe.");
  if (!row.cliente_empresa_ok) throw new Error("Integridad financiera: el cliente no pertenece a la empresa de la factura.");
  return row;
}

export function financialIntegrityReport(empresaId=null) {
  const params = [];
  const company = empresaId ? " AND f.empresa_id=?" : "";
  if (empresaId) params.push(Number(empresaId));
  const facturas = db.prepare(`
    SELECT f.id, f.codigo, f.empresa_id, f.cliente_id, e.nombre empresa,
      COALESCE(c.razon_social,c.nombre_comercial,c.nombre) cliente
    FROM facturas f
    JOIN empresas e ON e.id=f.empresa_id
    LEFT JOIN clientes c ON c.id=f.cliente_id
    WHERE (c.id IS NULL OR c.empresa_id<>f.empresa_id)${company}
    ORDER BY f.id
  `).all(...params);

  const pagosParams = [];
  const pagosCompany = empresaId ? " AND p.empresa_id=?" : "";
  if (empresaId) pagosParams.push(Number(empresaId));
  const pagos = db.prepare(`
    SELECT p.id, p.empresa_id, p.factura_id, p.cliente_id, p.valor,
      f.codigo factura, f.empresa_id factura_empresa_id, f.cliente_id factura_cliente_id
    FROM pagos_cartera p
    LEFT JOIN facturas f ON f.id=p.factura_id
    WHERE (f.id IS NULL OR f.empresa_id<>p.empresa_id OR f.cliente_id<>p.cliente_id)${pagosCompany}
    ORDER BY p.id
  `).all(...pagosParams);

  return { ok: facturas.length===0 && pagos.length===0, facturas_inconsistentes: facturas, pagos_inconsistentes: pagos, total_inconsistencias: facturas.length+pagos.length };
}
