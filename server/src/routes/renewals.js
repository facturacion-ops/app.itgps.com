import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r=Router();
const isAdmin=u=>u.rol==="Administrador";
const allowed=(req,row)=>row&&(isAdmin(req.user)||row.empresa_id===req.user.empresa_id);
function audit(req,accion,detalle,empresaId=req.user.empresa_id){
  try{db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)").run(empresaId,req.user.id,accion,"RENOVACIONES",detalle,req.ip,"OK",req.method,req.originalUrl,req.get("user-agent")||"")}catch{}
}
function nextCode(empresa){
  const rows=db.prepare("SELECT codigo FROM renovaciones WHERE empresa_id=? AND codigo<>''").all(empresa);let max=0;
  for(const x of rows){const m=String(x.codigo||"").match(/^REN-?(\d+)$/i);if(m)max=Math.max(max,Number(m[1]))}
  return `REN${String(max+1).padStart(4,"0")}`;
}
function addMonths(dateStr,months){
  const d=new Date(`${dateStr}T12:00:00`);if(Number.isNaN(d.getTime()))return "";
  const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+months);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));
  return d.toISOString().slice(0,10);
}
function addDays(dateStr,days){const d=new Date(`${dateStr}T12:00:00`);if(Number.isNaN(d.getTime()))return "";d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function nextInvoiceCode(empresa){const rows=db.prepare("SELECT codigo FROM facturas WHERE empresa_id=? AND codigo<>''").all(empresa);let max=0;for(const x of rows){const m=String(x.codigo||"").match(/^FAC-?(\d+)$/i);if(m)max=Math.max(max,Number(m[1]))}return `FAC${String(max+1).padStart(4,"0")}`;}
function renewalRow(id){return db.prepare(`SELECT r.*,c.nombre cliente,c.razon_social,c.nombre_comercial,s.codigo suscripcion_codigo,s.fecha_inicio,s.fecha_fin,s.estado suscripcion_estado,p.nombre plan,p.codigo plan_codigo,sv.nombre servicio,r.factura_id,f.codigo factura_codigo
 FROM renovaciones r JOIN clientes c ON c.id=r.cliente_id JOIN suscripciones s ON s.id=r.suscripcion_id JOIN planes p ON p.id=r.plan_id JOIN servicios sv ON sv.id=p.servicio_id LEFT JOIN facturas f ON f.id=r.factura_id WHERE r.id=?`).get(id)}

r.get("/catalogos",requireAuth,requirePermission("renovaciones.ver"),(req,res)=>{
 const empresa=isAdmin(req.user)&&Number(req.query.empresa_id)?Number(req.query.empresa_id):req.user.empresa_id;
 const dias=Math.min(365,Math.max(0,Number(req.query.dias||60)));
 const subs=db.prepare(`SELECT s.id,s.codigo,s.empresa_id,s.cliente_id,s.plan_id,s.fecha_inicio,s.fecha_fin,s.cantidad,s.precio,s.descuento,s.renovacion_automatica,s.estado,c.nombre cliente,c.razon_social,c.nombre_comercial,p.nombre plan,p.codigo plan_codigo,p.periodicidad,p.duracion_meses,sv.nombre servicio
 FROM suscripciones s JOIN clientes c ON c.id=s.cliente_id JOIN planes p ON p.id=s.plan_id JOIN servicios sv ON sv.id=p.servicio_id
 WHERE s.empresa_id=? AND s.estado='Activa' AND s.fecha_fin<>'' AND date(s.fecha_fin) BETWEEN date('now') AND date('now',?) ORDER BY date(s.fecha_fin),s.id`).all(empresa,`+${dias} days`);
 res.json({siguiente_codigo:nextCode(empresa),suscripciones:subs});
});

r.get("/",requireAuth,requirePermission("renovaciones.ver"),(req,res)=>{
 const q=String(req.query.q||"").trim(),estado=String(req.query.estado||"");
 const empresa=isAdmin(req.user)&&Number(req.query.empresa_id)?Number(req.query.empresa_id):req.user.empresa_id;const p=[empresa];
 let sql=`SELECT r.*,c.nombre cliente,c.razon_social,c.nombre_comercial,s.codigo suscripcion_codigo,p.nombre plan,sv.nombre servicio FROM renovaciones r JOIN clientes c ON c.id=r.cliente_id JOIN suscripciones s ON s.id=r.suscripcion_id JOIN planes p ON p.id=r.plan_id JOIN servicios sv ON sv.id=p.servicio_id WHERE r.empresa_id=?`;
 if(q){sql+=" AND (r.codigo LIKE ? OR c.nombre LIKE ? OR c.razon_social LIKE ? OR c.nombre_comercial LIKE ? OR s.codigo LIKE ? OR p.nombre LIKE ?)";const x=`%${q}%`;p.push(x,x,x,x,x,x)}
 if(estado){sql+=" AND r.estado=?";p.push(estado)}
 sql+=" ORDER BY date(r.nueva_fecha_inicio) DESC,r.id DESC LIMIT 1000";
 res.json({renovaciones:db.prepare(sql).all(...p)});
});

r.get("/:id",requireAuth,requirePermission("renovaciones.ver"),(req,res)=>{const x=renewalRow(Number(req.params.id));if(!allowed(req,x))return res.status(404).json({error:"Renovación no encontrada"});res.json({renovacion:x})});

r.post("/",requireAuth,requirePermission("renovaciones.crear"),(req,res)=>{
 const empresa=isAdmin(req.user)&&Number(req.body.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id;
 const sub=db.prepare(`SELECT s.*,p.periodicidad,p.duracion_meses,p.nombre plan,p.servicio_id,c.razon_social,c.nombre_comercial,c.nombre cliente FROM suscripciones s JOIN planes p ON p.id=s.plan_id JOIN clientes c ON c.id=s.cliente_id WHERE s.id=? AND s.empresa_id=?`).get(Number(req.body.suscripcion_id||0),empresa);
 if(!sub)return res.status(400).json({error:"La suscripción seleccionada no es válida."});
 if(sub.estado!=="Activa")return res.status(409).json({error:"Solo se pueden renovar suscripciones Activas."});
 if(!sub.fecha_fin)return res.status(409).json({error:"La suscripción no tiene fecha de vencimiento para renovar."});
 const pending=db.prepare("SELECT id,codigo FROM renovaciones WHERE suscripcion_id=? AND estado IN ('Programada','Procesada') AND nueva_fecha_inicio>=date(?)").get(sub.id,sub.fecha_fin);
 if(pending)return res.status(409).json({error:`La suscripción ya tiene la renovación ${pending.codigo||pending.id}.`});
 const months=Number(sub.duracion_meses)>0?Number(sub.duracion_meses):({Mensual:1,Bimestral:2,Trimestral:3,Semestral:6,Anual:12}[sub.periodicidad]||1);
 const nuevaInicio=String(req.body.nueva_fecha_inicio||addDays(sub.fecha_fin,1));
 const nuevaFin=String(req.body.nueva_fecha_fin||addMonths(nuevaInicio,months));
 if(!nuevaInicio||!nuevaFin||nuevaFin<=nuevaInicio)return res.status(400).json({error:"La nueva vigencia no es válida."});
 const precio=Math.max(0,Number(req.body.precio??sub.precio)),descuento=Math.max(0,Number(req.body.descuento??sub.descuento)),cantidad=Math.max(1,Number(req.body.cantidad??sub.cantidad));
 if(descuento>precio*cantidad)return res.status(400).json({error:"El descuento no puede superar el valor de la renovación."});
 try{
  const tx=db.transaction(()=>{const codigo=nextCode(empresa);const total=Math.max(0,precio*cantidad-descuento);const x=db.prepare(`INSERT INTO renovaciones(empresa_id,cliente_id,suscripcion_id,plan_id,codigo,fecha_renovacion,fecha_anterior_fin,nueva_fecha_inicio,nueva_fecha_fin,cantidad,precio,descuento,total,estado,observaciones,creado_por) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(empresa,sub.cliente_id,sub.id,sub.plan_id,codigo,new Date().toISOString().slice(0,10),sub.fecha_fin,nuevaInicio,nuevaFin,cantidad,precio,descuento,total,"Procesada",String(req.body.observaciones||""),req.user.id);db.prepare("UPDATE suscripciones SET fecha_inicio=?,fecha_fin=?,cantidad=?,precio=?,descuento=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(nuevaInicio,nuevaFin,cantidad,precio,descuento,sub.id);return {id:Number(x.lastInsertRowid),codigo,total}})();
  audit(req,"CREAR",`Renovó suscripción ${sub.codigo||sub.id} mediante ${tx.codigo}`,empresa);
  res.status(201).json({ok:true,...tx,renovacion:renewalRow(tx.id)});
 }catch(e){console.error("[RENOVACIONES]",e);res.status(400).json({error:e.message||"No fue posible procesar la renovación."})}
});

r.post("/:id/facturar",requireAuth,requirePermission("renovaciones.editar"),(req,res)=>{
 const id=Number(req.params.id),x=renewalRow(id);if(!allowed(req,x))return res.status(404).json({error:"Renovación no encontrada"});
 if(x.factura_id)return res.status(409).json({error:`La renovación ya tiene la factura ${x.factura_codigo||x.factura_id}.`});
 try{const tx=db.transaction(()=>{const codigo=nextInvoiceCode(x.empresa_id);const fecha=String(req.body.fecha_emision||new Date().toISOString().slice(0,10));const venc=String(req.body.fecha_vencimiento||x.nueva_fecha_fin||"");const f=db.prepare(`INSERT INTO facturas(empresa_id,cliente_id,cotizacion_id,codigo,fecha_emision,fecha_vencimiento,estado,subtotal,descuento,impuestos,total,observaciones,creado_por,fecha_actualizacion) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run(x.empresa_id,x.cliente_id,null,codigo,fecha,venc,"Borrador",x.total+x.descuento,x.descuento,0,x.total,String(req.body.observaciones||`Factura por renovación ${x.codigo}`),req.user.id);const ins=db.prepare("INSERT INTO factura_detalles(factura_id,servicio_id,plan_id,descripcion,cantidad,precio_unitario,descuento,subtotal,orden) VALUES(?,?,?,?,?,?,?,?,?)");ins.run(Number(f.lastInsertRowid),x.servicio_id,x.plan_id,`Renovación ${x.codigo} — ${x.plan} / ${x.servicio}`,x.cantidad,x.precio,x.descuento,x.total,1);db.prepare("UPDATE renovaciones SET factura_id=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(Number(f.lastInsertRowid),id);return {id:Number(f.lastInsertRowid),codigo}})();audit(req,"FACTURAR",`Generó factura ${tx.codigo} para renovación ${x.codigo}`,x.empresa_id);res.status(201).json({ok:true,...tx})}catch(e){console.error("[RENOVACIONES/FACTURAR]",e);res.status(400).json({error:e.message||"No fue posible generar la factura."})}
});

r.patch("/:id/cancelar",requireAuth,requirePermission("renovaciones.editar"),(req,res)=>{const id=Number(req.params.id),x=renewalRow(id);if(!allowed(req,x))return res.status(404).json({error:"Renovación no encontrada"});if(x.estado!=="Procesada"&&x.estado!=="Programada")return res.status(409).json({error:"La renovación ya está cerrada."});db.prepare("UPDATE renovaciones SET estado='Cancelada',fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(id);audit(req,"CANCELAR",`Canceló renovación ${x.codigo}`,x.empresa_id);res.json({ok:true,estado:"Cancelada"})});
export default r;
