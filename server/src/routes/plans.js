import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const isAdmin = (u) => u.rol === "Administrador";
function audit(req, accion, detalle, empresaId = req.user.empresa_id) {
  db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)").run(empresaId, req.user.id, accion, "PLANES", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent") || "");
}
function getPlan(id) {
  return db.prepare(`SELECT p.*, e.nombre empresa, s.nombre servicio, s.categoria servicio_categoria
    FROM planes p JOIN empresas e ON e.id=p.empresa_id JOIN servicios s ON s.id=p.servicio_id WHERE p.id=?`).get(id);
}
function allowed(req,row){ return row && (isAdmin(req.user) || row.empresa_id===req.user.empresa_id); }
function normalize(b={}){
  return { codigo:String(b.codigo||"").trim(), nombre:String(b.nombre||"").trim(), descripcion:String(b.descripcion||"").trim(), modalidad:String(b.modalidad||"Recurrente").trim(), periodicidad:String(b.periodicidad||"Mensual").trim(), precio:Number(b.precio||0), costo_instalacion:Number(b.costo_instalacion||0), duracion_meses:Number(b.duracion_meses||0), estado:Number(b.estado)?1:0, observaciones:String(b.observaciones||"").trim() };
}

r.get("/export", requireAuth, requirePermission("planes.exportar"), (req,res)=>{
  const q=String(req.query.q||"").trim(); const estado=req.query.estado==="0"?0:req.query.estado==="1"?1:null; const requested=Number(req.query.empresa_id||0); const empresaId=isAdmin(req.user)&&requested?requested:req.user.empresa_id; const servicioId=Number(req.query.servicio_id||0); const params=[empresaId];
  let sql=`SELECT p.codigo,p.nombre,s.nombre servicio,p.modalidad,p.periodicidad,p.precio,p.costo_instalacion,p.duracion_meses,CASE WHEN p.estado=1 THEN 'Activo' ELSE 'Inactivo' END estado,e.nombre empresa,p.descripcion,p.observaciones FROM planes p JOIN empresas e ON e.id=p.empresa_id JOIN servicios s ON s.id=p.servicio_id WHERE p.empresa_id=?`;
  if(q){sql+=" AND (p.codigo LIKE ? OR p.nombre LIKE ? OR p.descripcion LIKE ? OR s.nombre LIKE ?)";const like=`%${q}%`;params.push(like,like,like,like);} if(estado!==null){sql+=" AND p.estado=?";params.push(estado);} if(servicioId){sql+=" AND p.servicio_id=?";params.push(servicioId);} sql+=" ORDER BY p.nombre";
  const rows=db.prepare(sql).all(...params),headers=["codigo","nombre","servicio","modalidad","periodicidad","precio","costo_instalacion","duracion_meses","estado","empresa","descripcion","observaciones"],cell=v=>`"${String(v??"").replaceAll('"','""')}"`; const csv=[headers.join(","),...rows.map(x=>headers.map(h=>cell(x[h])).join(","))].join("\n");
  res.setHeader("Content-Type","text/csv; charset=utf-8"); res.setHeader("Content-Disposition",`attachment; filename="planes-itgps-${new Date().toISOString().slice(0,10)}.csv"`); res.send("\ufeff"+csv);
});

r.get("/", requireAuth, requirePermission("planes.ver"), (req,res)=>{
  const q=String(req.query.q||"").trim(); const estado=req.query.estado==="0"?0:req.query.estado==="1"?1:null;
  const requested=Number(req.query.empresa_id||0); const empresaId=isAdmin(req.user)&&requested?requested:req.user.empresa_id;
  const servicioId=Number(req.query.servicio_id||0); const params=[empresaId];
  let sql=`SELECT p.id,p.empresa_id,p.servicio_id,p.codigo,p.nombre,p.descripcion,p.modalidad,p.periodicidad,p.precio,p.costo_instalacion,p.duracion_meses,p.estado,p.observaciones,p.fecha_creacion,p.fecha_actualizacion,e.nombre empresa,s.nombre servicio,s.categoria servicio_categoria FROM planes p JOIN empresas e ON e.id=p.empresa_id JOIN servicios s ON s.id=p.servicio_id WHERE p.empresa_id=?`;
  if(q){sql+=" AND (p.codigo LIKE ? OR p.nombre LIKE ? OR p.descripcion LIKE ? OR s.nombre LIKE ?)";const like=`%${q}%`;params.push(like,like,like,like);}
  if(estado!==null){sql+=" AND p.estado=?";params.push(estado);}
  if(servicioId){sql+=" AND p.servicio_id=?";params.push(servicioId);}
  sql+=" ORDER BY p.nombre LIMIT 1000";
  res.json({planes:db.prepare(sql).all(...params)});
});

r.get("/:id", requireAuth, requirePermission("planes.ver"),(req,res)=>{const row=getPlan(Number(req.params.id));if(!allowed(req,row))return res.status(404).json({error:"Plan no encontrado"});res.json({plan:row});});

r.post("/", requireAuth, requirePermission("planes.crear"),(req,res)=>{
  const data=normalize(req.body); const servicioId=Number(req.body.servicio_id||0);
  if(!data.nombre)return res.status(400).json({error:"Nombre del plan obligatorio"});
  if(!servicioId)return res.status(400).json({error:"Debe seleccionar un servicio"});
  if(!Number.isFinite(data.precio)||data.precio<0||!Number.isFinite(data.costo_instalacion)||data.costo_instalacion<0)return res.status(400).json({error:"Valores de precio no válidos"});
  if(!Number.isInteger(data.duracion_meses)||data.duracion_meses<0)return res.status(400).json({error:"Duración no válida"});
  const empresaId=isAdmin(req.user)&&Number(req.body.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id;
  const servicio=db.prepare("SELECT id,empresa_id,estado FROM servicios WHERE id=?").get(servicioId);
  if(!servicio || servicio.empresa_id!==empresaId || !servicio.estado)return res.status(400).json({error:"El servicio seleccionado no es válido o está inactivo"});
  try{const x=db.prepare(`INSERT INTO planes(empresa_id,servicio_id,codigo,nombre,descripcion,modalidad,periodicidad,precio,costo_instalacion,duracion_meses,estado,observaciones,creado_por,fecha_actualizacion) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run(empresaId,servicioId,data.codigo,data.nombre,data.descripcion,data.modalidad,data.periodicidad,data.precio,data.costo_instalacion,data.duracion_meses,data.estado,data.observaciones,req.user.id);audit(req,"CREAR",`Creó plan ${data.nombre}`,empresaId);res.status(201).json({ok:true,id:Number(x.lastInsertRowid)});}catch(err){if(String(err.message||"").includes("UNIQUE"))return res.status(409).json({error:"Ya existe un plan con ese código en la empresa"});res.status(409).json({error:"No fue posible crear el plan"});}
});

r.put("/:id", requireAuth, requirePermission("planes.editar"),(req,res)=>{
  const id=Number(req.params.id),current=getPlan(id); if(!allowed(req,current))return res.status(404).json({error:"Plan no encontrado"}); const data=normalize(req.body); const servicioId=Number(req.body.servicio_id||0);
  if(!data.nombre)return res.status(400).json({error:"Nombre del plan obligatorio"}); if(!servicioId)return res.status(400).json({error:"Debe seleccionar un servicio"});
  const servicio=db.prepare("SELECT id,empresa_id,estado FROM servicios WHERE id=?").get(servicioId); if(!servicio||servicio.empresa_id!==current.empresa_id||!servicio.estado)return res.status(400).json({error:"El servicio seleccionado no es válido o está inactivo"});
  try{db.prepare(`UPDATE planes SET servicio_id=?,codigo=?,nombre=?,descripcion=?,modalidad=?,periodicidad=?,precio=?,costo_instalacion=?,duracion_meses=?,estado=?,observaciones=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`).run(servicioId,data.codigo,data.nombre,data.descripcion,data.modalidad,data.periodicidad,data.precio,data.costo_instalacion,data.duracion_meses,data.estado,data.observaciones,id);audit(req,"EDITAR",`Editó plan ${id} — ${data.nombre}`,current.empresa_id);res.json({ok:true});}catch(err){if(String(err.message||"").includes("UNIQUE"))return res.status(409).json({error:"Ya existe un plan con ese código en la empresa"});res.status(409).json({error:"No fue posible actualizar el plan"});}
});

r.delete("/:id", requireAuth, requirePermission("planes.eliminar"),(req,res)=>{const id=Number(req.params.id),current=getPlan(id);if(!allowed(req,current))return res.status(404).json({error:"Plan no encontrado"});const estado=current.estado?0:1;db.prepare("UPDATE planes SET estado=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(estado,id);audit(req,estado?"ACTIVAR":"DESACTIVAR",`${estado?"Activó":"Desactivó"} plan ${id} — ${current.nombre}`,current.empresa_id);res.json({ok:true,estado});});

export default r;
