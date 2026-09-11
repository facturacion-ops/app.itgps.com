import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const admin = u => u.rol === "Administrador";
function company(req){ const id=Number(req.query.empresa_id||0); return admin(req.user)&&id?id:req.user.empresa_id; }
function csv(res, filename, rows){
  const headers=rows.length?Object.keys(rows[0]):[]; const cell=v=>`"${String(v??"").replaceAll('"','""')}"`;
  res.setHeader("Content-Type","text/csv; charset=utf-8"); res.setHeader("Content-Disposition",`attachment; filename="${filename}"`);
  res.send("\ufeff"+[headers.join(","),...rows.map(x=>headers.map(h=>cell(x[h])).join(","))].join("\n"));
}
function filters(req, tableAlias=""){ const q=String(req.query.q||"").trim(); const estado=req.query.estado; const cid=company(req); return {q,estado,cid,alias:tableAlias}; }

r.get("/filtros",requireAuth,requirePermission("reportes.ver"),(req,res)=>{
  const empresas=admin(req.user)?db.prepare("SELECT id,nombre,nit FROM empresas WHERE estado=1 ORDER BY nombre").all():[];
  res.json({empresas,periodos:["Hoy","Últimos 7 días","Este mes","Mes anterior"]});
});

r.get("/resumen",requireAuth,requirePermission("reportes.ver"),(req,res)=>{
  const cid=company(req);
  const get=(sql,...p)=>db.prepare(sql).get(...p)?.n||0;
  res.json({resumen:{clientes:get("SELECT count(*) n FROM clientes WHERE empresa_id=?",cid),activos:get("SELECT count(*) n FROM activos WHERE empresa_id=?",cid),equipos:get("SELECT count(*) n FROM equipos WHERE empresa_id=?",cid),sim:get("SELECT count(*) n FROM sim_cards WHERE empresa_id=?",cid),m2m:get("SELECT count(*) n FROM m2m_planes WHERE empresa_id=? AND estado=1",cid),alertas:get("SELECT count(*) n FROM m2m_alertas WHERE empresa_id=? AND estado='ABIERTA'",cid)}});
});

r.get("/clientes",requireAuth,requirePermission("reportes.ver"),(req,res)=>{ const cid=company(req), q=String(req.query.q||"").trim(),p=[cid]; let sql=`SELECT c.codigo,c.nombre,c.nit,c.tipo_cliente,c.contacto,c.telefono,c.correo,c.ciudad,CASE WHEN c.estado=1 THEN 'Activo' ELSE 'Inactivo' END estado,e.nombre empresa,c.fecha_creacion FROM clientes c JOIN empresas e ON e.id=c.empresa_id WHERE c.empresa_id=?`; if(q){sql+=` AND (c.codigo LIKE ? OR c.nombre LIKE ? OR c.nit LIKE ? OR c.correo LIKE ?)`;let x=`%${q}%`;p.push(x,x,x,x)} sql+=' ORDER BY c.nombre'; res.json({rows:db.prepare(sql).all(...p)}); });

r.get("/activos",requireAuth,requirePermission("reportes.ver"),(req,res)=>{ const cid=company(req),p=[cid]; let sql=`SELECT a.codigo,a.placa,a.tipo_activo,a.marca,a.linea,a.modelo,CASE WHEN a.estado='Activo' THEN 'Activo' ELSE a.estado END estado,c.nombre cliente,e.nombre empresa,a.fecha_alta FROM activos a JOIN empresas e ON e.id=a.empresa_id JOIN clientes c ON c.id=a.cliente_id WHERE a.empresa_id=? ORDER BY c.nombre,a.codigo`; res.json({rows:db.prepare(sql).all(...p)}); });

r.get("/equipos",requireAuth,requirePermission("reportes.ver"),(req,res)=>{ const cid=company(req); const rows=db.prepare(`SELECT e.imei,co.nombre empresa, a.codigo activo,a.placa,c.nombre cliente FROM equipos e JOIN empresas co ON co.id=e.empresa_id LEFT JOIN activos a ON a.id=e.activo_id LEFT JOIN clientes c ON c.id=a.cliente_id WHERE e.empresa_id=? ORDER BY e.imei`).all(cid); res.json({rows}); });

r.get("/sim",requireAuth,requirePermission("reportes.ver"),(req,res)=>{ const cid=company(req); const rows=db.prepare(`SELECT s.iccid,s.imsi,s.numero,s.operador,s.estado,co.nombre empresa,s.fecha_activacion FROM sim_cards s JOIN empresas co ON co.id=s.empresa_id WHERE s.empresa_id=? ORDER BY s.iccid`).all(cid); res.json({rows}); });

r.get("/m2m",requireAuth,requirePermission("reportes.ver"),(req,res)=>{ const cid=company(req); const rows=db.prepare(`SELECT p.nombre plan,p.operador,p.mb_incluidos,p.costo_mensual,p.dia_corte,CASE WHEN p.estado=1 THEN 'Activo' ELSE 'Inactivo' END estado,e.nombre empresa FROM m2m_planes p JOIN empresas e ON e.id=p.empresa_id WHERE p.empresa_id=? ORDER BY p.nombre`).all(cid); res.json({rows}); });

r.get("/consumo",requireAuth,requirePermission("reportes.ver"),(req,res)=>{ const cid=company(req); const rows=db.prepare(`SELECT m.periodo,s.iccid,s.operador,m.mb_consumidos,COALESCE(p.mb_incluidos,0) mb_incluidos,CASE WHEN COALESCE(p.mb_incluidos,0)>0 THEN ROUND(m.mb_consumidos*100.0/p.mb_incluidos,2) ELSE 0 END porcentaje,e.nombre empresa FROM m2m_consumos m JOIN sim_cards s ON s.id=m.sim_id JOIN empresas e ON e.id=s.empresa_id LEFT JOIN m2m_planes p ON p.id=s.plan_id WHERE s.empresa_id=? ORDER BY m.periodo DESC,s.iccid`).all(cid); res.json({rows}); });

r.get("/export/:tipo",requireAuth,requirePermission("reportes.exportar"),(req,res)=>{ const tipo=req.params.tipo; const cid=company(req); let rows=[]; if(tipo==='clientes') rows=db.prepare(`SELECT c.codigo,c.nombre,c.nit,c.tipo_cliente,c.contacto,c.telefono,c.correo,c.ciudad,CASE WHEN c.estado=1 THEN 'Activo' ELSE 'Inactivo' END estado,e.nombre empresa,c.fecha_creacion FROM clientes c JOIN empresas e ON e.id=c.empresa_id WHERE c.empresa_id=? ORDER BY c.nombre`).all(cid); else if(tipo==='activos') rows=db.prepare(`SELECT a.codigo,a.placa,a.tipo_activo,a.marca,a.linea,a.modelo,a.estado,c.nombre cliente,e.nombre empresa,a.fecha_alta FROM activos a JOIN empresas e ON e.id=a.empresa_id JOIN clientes c ON c.id=a.cliente_id WHERE a.empresa_id=? ORDER BY a.codigo`).all(cid); else if(tipo==='equipos') rows=db.prepare(`SELECT e.imei,co.nombre empresa,a.codigo activo,a.placa,c.nombre cliente FROM equipos e JOIN empresas co ON co.id=e.empresa_id LEFT JOIN activos a ON a.id=e.activo_id LEFT JOIN clientes c ON c.id=a.cliente_id WHERE e.empresa_id=? ORDER BY e.imei`).all(cid); else if(tipo==='sim') rows=db.prepare(`SELECT s.iccid,s.imsi,s.numero,s.operador,s.estado,co.nombre empresa FROM sim_cards s JOIN empresas co ON co.id=s.empresa_id WHERE s.empresa_id=? ORDER BY s.iccid`).all(cid); else if(tipo==='m2m') rows=db.prepare(`SELECT p.nombre plan,p.operador,p.mb_incluidos,p.costo_mensual,p.dia_corte,CASE WHEN p.estado=1 THEN 'Activo' ELSE 'Inactivo' END estado,e.nombre empresa FROM m2m_planes p JOIN empresas e ON e.id=p.empresa_id WHERE p.empresa_id=? ORDER BY p.nombre`).all(cid); else if(tipo==='consumo') rows=db.prepare(`SELECT m.periodo,s.iccid,s.operador,m.mb_consumidos,COALESCE(p.mb_incluidos,0) mb_incluidos,e.nombre empresa FROM m2m_consumos m JOIN sim_cards s ON s.id=m.sim_id JOIN empresas e ON e.id=s.empresa_id LEFT JOIN m2m_planes p ON p.id=s.plan_id WHERE s.empresa_id=? ORDER BY m.periodo DESC`).all(cid); else return res.status(400).json({error:'Reporte no soportado'}); csv(res,`itgps-reporte-${tipo}-${new Date().toISOString().slice(0,10)}.csv`,rows); });

export default r;
