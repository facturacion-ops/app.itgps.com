import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const isAdmin = u => u.rol === "Administrador";

function audit(req, accion, detalle, empresaId=req.user.empresa_id) {
  try {
    db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)")
      .run(empresaId, req.user.id, accion, "ORDENES_SERVICIO", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent") || "");
  } catch {}
}
function nextCode(e) {
  const rows=db.prepare("SELECT codigo FROM ordenes_servicio WHERE empresa_id=?").all(e);
  let m=0;
  for(const x of rows){ const z=String(x.codigo||"").match(/^OS-?(\d+)$/i); if(z)m=Math.max(m,Number(z[1])); }
  return `OS${String(m+1).padStart(4,"0")}`;
}
function row(id) {
  return db.prepare(`SELECT o.*, e.nombre empresa,
    COALESCE(NULLIF(cl.razon_social,''),NULLIF(cl.nombre_comercial,''),cl.nombre) cliente_nombre,
    c.codigo contrato_codigo, a.codigo activo_codigo, a.placa,
    COALESCE(u.nombre||' '||u.apellido,'') responsable_nombre
    FROM ordenes_servicio o
    JOIN empresas e ON e.id=o.empresa_id
    JOIN clientes cl ON cl.id=o.cliente_id
    LEFT JOIN contratos c ON c.id=o.contrato_id
    LEFT JOIN activos a ON a.id=o.activo_id
    LEFT JOIN usuarios u ON u.id=o.responsable_id
    WHERE o.id=?`).get(id);
}
function allowed(req,x){return x&&(isAdmin(req.user)||x.empresa_id===req.user.empresa_id);}

r.get("/catalogos",requireAuth,requirePermission("ordenes_servicio.ver"),(req,res)=>{
  const e=isAdmin(req.user)&&Number(req.query.empresa_id)?Number(req.query.empresa_id):req.user.empresa_id;
  const clientes=db.prepare("SELECT id,nombre,razon_social,nombre_comercial FROM clientes WHERE empresa_id=? AND estado=1 ORDER BY COALESCE(NULLIF(razon_social,''),nombre)").all(e);
  const contratos=db.prepare("SELECT id,codigo,cliente_id,titulo,estado FROM contratos WHERE empresa_id=? AND estado='Activo' ORDER BY id DESC").all(e);
  const activos=db.prepare("SELECT id,codigo,placa,cliente_id,tipo_activo,estado FROM activos WHERE empresa_id=? AND estado NOT IN ('Inactivo','Baja') ORDER BY codigo").all(e);
  const usuarios=db.prepare("SELECT id,nombre,apellido FROM usuarios WHERE empresa_id=? AND estado=1 ORDER BY nombre,apellido").all(e);
  const empresas=isAdmin(req.user)?db.prepare("SELECT id,nombre FROM empresas WHERE estado=1 ORDER BY nombre").all():[];
  res.json({siguiente_codigo:nextCode(e),clientes,contratos,activos,usuarios,empresas});
});

r.get("/",requireAuth,requirePermission("ordenes_servicio.ver"),(req,res)=>{
  const e=isAdmin(req.user)&&Number(req.query.empresa_id)?Number(req.query.empresa_id):req.user.empresa_id;
  const q=String(req.query.q||"").trim(), estado=String(req.query.estado||"");
  const p=[e]; let sql=`SELECT o.*,COALESCE(NULLIF(cl.razon_social,''),NULLIF(cl.nombre_comercial,''),cl.nombre) cliente_nombre,c.codigo contrato_codigo,a.codigo activo_codigo,a.placa,
    COALESCE(u.nombre||' '||u.apellido,'') responsable_nombre
    FROM ordenes_servicio o JOIN clientes cl ON cl.id=o.cliente_id
    LEFT JOIN contratos c ON c.id=o.contrato_id LEFT JOIN activos a ON a.id=o.activo_id
    LEFT JOIN usuarios u ON u.id=o.responsable_id WHERE o.empresa_id=?`;
  if(q){sql+=" AND (o.codigo LIKE ? OR o.titulo LIKE ? OR cl.nombre LIKE ? OR cl.razon_social LIKE ? OR a.codigo LIKE ? OR a.placa LIKE ?)";const x=`%${q}%`;p.push(x,x,x,x,x,x);}
  if(estado){sql+=" AND o.estado=?";p.push(estado);}
  sql+=" ORDER BY o.fecha_solicitud DESC,o.id DESC LIMIT 1000";
  res.json({ordenes:db.prepare(sql).all(...p)});
});

r.get("/:id",requireAuth,requirePermission("ordenes_servicio.ver"),(req,res)=>{
  const x=row(Number(req.params.id)); if(!allowed(req,x))return res.status(404).json({error:"Orden de servicio no encontrada"});
  res.json({orden:x});
});

r.post("/",requireAuth,requirePermission("ordenes_servicio.crear"),(req,res)=>{
  const e=isAdmin(req.user)&&Number(req.body.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id;
  const cliente=db.prepare("SELECT id FROM clientes WHERE id=? AND empresa_id=? AND estado=1").get(Number(req.body.cliente_id||0),e);
  if(!cliente)return res.status(400).json({error:"El cliente seleccionado no es válido."});
  const contratoId=Number(req.body.contrato_id||0)||null;
  if(contratoId){
    const c=db.prepare("SELECT id,cliente_id,estado FROM contratos WHERE id=? AND empresa_id=?").get(contratoId,e);
    if(!c||c.cliente_id!==cliente.id||c.estado!=="Activo")return res.status(409).json({error:"El contrato debe estar Activo y pertenecer al cliente."});
  }
  const activoId=Number(req.body.activo_id||0)||null;
  if(activoId){
    const a=db.prepare("SELECT id,cliente_id FROM activos WHERE id=? AND empresa_id=?").get(activoId,e);
    if(!a||a.cliente_id!==cliente.id)return res.status(409).json({error:"El activo debe pertenecer al cliente."});
  }
  const fecha=String(req.body.fecha_solicitud||"").trim()||new Date().toISOString().slice(0,10);
  const titulo=String(req.body.titulo||"").trim();
  if(!titulo)return res.status(400).json({error:"El título de la orden es obligatorio."});
  const estado=String(req.body.estado||"Borrador");
  const estados=["Borrador","Programada","En proceso","Completada","Cancelada"];
  if(!estados.includes(estado))return res.status(400).json({error:"Estado no válido."});
  try{
    const x=db.prepare(`INSERT INTO ordenes_servicio(empresa_id,cliente_id,contrato_id,activo_id,codigo,tipo,prioridad,titulo,descripcion,fecha_solicitud,fecha_programada,estado,responsable_id,observaciones,creado_por)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(e,cliente.id,contratoId,activoId,nextCode(e),String(req.body.tipo||"Instalación"),String(req.body.prioridad||"Media"),titulo,String(req.body.descripcion||""),fecha,String(req.body.fecha_programada||""),estado,Number(req.body.responsable_id||0)||null,String(req.body.observaciones||""),req.user.id);
    const id=Number(x.lastInsertRowid),codigo=row(id).codigo;
    try{db.pragma("wal_checkpoint(PASSIVE)")}catch{}
    audit(req,"CREAR",`Creó orden ${codigo}`,e);
    res.status(201).json({ok:true,id,codigo,orden:row(id)});
  }catch(err){res.status(409).json({error:err.message||"No fue posible crear la orden."});}
});

r.put("/:id",requireAuth,requirePermission("ordenes_servicio.editar"),(req,res)=>{
  const id=Number(req.params.id),cur=row(id);
  if(!allowed(req,cur))return res.status(404).json({error:"Orden de servicio no encontrada"});
  if(["Completada","Cancelada"].includes(cur.estado))return res.status(409).json({error:"Una orden Completada o Cancelada no puede editarse."});
  const clienteId=Number(req.body.cliente_id||cur.cliente_id);
  const cliente=db.prepare("SELECT id FROM clientes WHERE id=? AND empresa_id=? AND estado=1").get(clienteId,cur.empresa_id);
  if(!cliente)return res.status(400).json({error:"El cliente seleccionado no es válido."});
  const contratoId=Number(req.body.contrato_id||0)||null;
  if(contratoId){
    const c=db.prepare("SELECT id,cliente_id,estado FROM contratos WHERE id=? AND empresa_id=?").get(contratoId,cur.empresa_id);
    if(!c||c.cliente_id!==clienteId||c.estado!=="Activo")return res.status(409).json({error:"El contrato debe estar Activo y pertenecer al cliente."});
  }
  const activoId=Number(req.body.activo_id||0)||null;
  if(activoId){
    const a=db.prepare("SELECT id,cliente_id FROM activos WHERE id=? AND empresa_id=?").get(activoId,cur.empresa_id);
    if(!a||a.cliente_id!==clienteId)return res.status(409).json({error:"El activo debe pertenecer al cliente."});
  }
  const titulo=String(req.body.titulo||"").trim(); if(!titulo)return res.status(400).json({error:"El título de la orden es obligatorio."});
  const estados=["Borrador","Programada","En proceso","Completada","Cancelada"],estado=String(req.body.estado||cur.estado);
  if(!estados.includes(estado))return res.status(400).json({error:"Estado no válido."});
  const fi=String(req.body.fecha_programada||"");
  db.prepare(`UPDATE ordenes_servicio SET cliente_id=?,contrato_id=?,activo_id=?,tipo=?,prioridad=?,titulo=?,descripcion=?,fecha_programada=?,estado=?,responsable_id=?,observaciones=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`)
    .run(clienteId,contratoId,activoId,String(req.body.tipo||cur.tipo),String(req.body.prioridad||cur.prioridad),titulo,String(req.body.descripcion||""),fi,estado,Number(req.body.responsable_id||0)||null,String(req.body.observaciones||""),id);
  audit(req,"EDITAR",`Editó orden ${cur.codigo}`,cur.empresa_id);
  res.json({ok:true,orden:row(id)});
});

r.patch("/:id/estado",requireAuth,requirePermission("ordenes_servicio.editar"),(req,res)=>{
  const id=Number(req.params.id),cur=row(id); if(!allowed(req,cur))return res.status(404).json({error:"Orden de servicio no encontrada"});
  const estados=["Borrador","Programada","En proceso","Completada","Cancelada"],next=String(req.body.estado||"");
  if(!estados.includes(next))return res.status(400).json({error:"Estado no válido."});
  if(["Completada","Cancelada"].includes(cur.estado))return res.status(409).json({error:"La orden está cerrada y no puede cambiar de estado."});
  db.prepare("UPDATE ordenes_servicio SET estado=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(next,id);
  audit(req,"CAMBIAR_ESTADO",`Cambió ${cur.codigo} a ${next}`,cur.empresa_id);
  res.json({ok:true,estado:next});
});

r.delete("/:id",requireAuth,requirePermission("ordenes_servicio.eliminar"),(req,res)=>{
  const id=Number(req.params.id),cur=row(id); if(!allowed(req,cur))return res.status(404).json({error:"Orden de servicio no encontrada"});
  if(["En proceso","Completada"].includes(cur.estado))return res.status(409).json({error:"Una orden en proceso o completada no puede eliminarse."});
  db.prepare("UPDATE ordenes_servicio SET estado='Cancelada',fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(id);
  audit(req,"CANCELAR",`Canceló ${cur.codigo}`,cur.empresa_id);
  res.json({ok:true});
});
export default r;
