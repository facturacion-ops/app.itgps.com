import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const isAdmin = (u) => u.rol === "Administrador";

function audit(req, accion, detalle, empresaId = req.user.empresa_id) {
  db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(empresaId, req.user.id, accion, "SERVICIOS", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent") || "");
}

function normalize(body = {}) {
  return {
    codigo: String(body.codigo || "").trim(),
    nombre: String(body.nombre || "").trim(),
    categoria: String(body.categoria || "Otro").trim(),
    descripcion: String(body.descripcion || "").trim(),
    modalidad: String(body.modalidad || "Recurrente").trim(),
    periodicidad: String(body.periodicidad || "Mensual").trim(),
    precio_base: Number(body.precio_base || 0),
    estado: Number(body.estado) ? 1 : 0,
    observaciones: String(body.observaciones || "").trim()
  };
}

function service(id) {
  return db.prepare(`SELECT s.*, e.nombre empresa,
    COALESCE(u.nombre || ' ' || u.apellido, '') creado_por_nombre
    FROM servicios s JOIN empresas e ON e.id=s.empresa_id
    LEFT JOIN usuarios u ON u.id=s.creado_por WHERE s.id=?`).get(id);
}

function allowed(req, row) {
  return row && (isAdmin(req.user) || row.empresa_id === req.user.empresa_id);
}

r.get("/export", requireAuth, requirePermission("servicios.exportar"), (req, res) => {
  const q = String(req.query.q || "").trim();
  const estado = req.query.estado === "0" ? 0 : req.query.estado === "1" ? 1 : null;
  const empresaId = isAdmin(req.user) && req.query.empresa_id ? Number(req.query.empresa_id) : req.user.empresa_id;
  const params = [empresaId];
  let sql = `SELECT s.codigo,s.nombre,s.categoria,s.descripcion,s.modalidad,s.periodicidad,s.precio_base,
    CASE WHEN s.estado=1 THEN 'Activo' ELSE 'Inactivo' END estado,e.nombre empresa,s.observaciones,
    s.fecha_creacion,s.fecha_actualizacion FROM servicios s JOIN empresas e ON e.id=s.empresa_id WHERE s.empresa_id=?`;
  if (q) { sql += " AND (s.codigo LIKE ? OR s.nombre LIKE ? OR s.categoria LIKE ? OR s.descripcion LIKE ?)"; const like=`%${q}%`; params.push(like,like,like,like); }
  if (estado !== null) { sql += " AND s.estado=?"; params.push(estado); }
  sql += " ORDER BY s.nombre";
  const rows=db.prepare(sql).all(...params);
  const headers=["codigo","nombre","categoria","descripcion","modalidad","periodicidad","precio_base","estado","empresa","observaciones","fecha_creacion","fecha_actualizacion"];
  const cell=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=[headers.join(","),...rows.map(x=>headers.map(h=>cell(x[h])).join(","))].join("\n");
  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader("Content-Disposition",`attachment; filename="servicios-itgps-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send("\ufeff"+csv);
});

r.get("/", requireAuth, requirePermission("servicios.ver"), (req,res)=>{
  const q=String(req.query.q||"").trim();
  const estado=req.query.estado==="0"?0:req.query.estado==="1"?1:null;
  const requested=Number(req.query.empresa_id||0);
  const empresaId=isAdmin(req.user)&&requested?requested:req.user.empresa_id;
  const params=[empresaId];
  let sql=`SELECT s.id,s.empresa_id,s.codigo,s.nombre,s.categoria,s.descripcion,s.modalidad,s.periodicidad,s.precio_base,s.estado,s.observaciones,s.creado_por,s.fecha_creacion,s.fecha_actualizacion,e.nombre empresa FROM servicios s JOIN empresas e ON e.id=s.empresa_id WHERE s.empresa_id=?`;
  if(q){sql+=" AND (s.codigo LIKE ? OR s.nombre LIKE ? OR s.categoria LIKE ? OR s.descripcion LIKE ?)";const like=`%${q}%`;params.push(like,like,like,like);}
  if(estado!==null){sql+=" AND s.estado=?";params.push(estado);}
  sql+=" ORDER BY s.nombre LIMIT 1000";
  res.json({servicios:db.prepare(sql).all(...params)});
});

r.get("/:id", requireAuth, requirePermission("servicios.ver"), (req,res)=>{
  const row=service(Number(req.params.id));
  if(!allowed(req,row)) return res.status(404).json({error:"Servicio no encontrado"});
  res.json({servicio:row});
});

r.post("/", requireAuth, requirePermission("servicios.crear"), (req,res)=>{
  const data=normalize(req.body);
  if(!data.nombre) return res.status(400).json({error:"Nombre del servicio obligatorio"});
  if(!Number.isFinite(data.precio_base)||data.precio_base<0) return res.status(400).json({error:"Precio base no válido"});
  const empresaId=isAdmin(req.user)&&Number(req.body?.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id;
  const company=db.prepare("SELECT id FROM empresas WHERE id=? AND estado=1").get(empresaId);
  if(!company) return res.status(400).json({error:"Empresa no válida o inactiva"});
  try{
    const result=db.prepare(`INSERT INTO servicios(empresa_id,codigo,nombre,categoria,descripcion,modalidad,periodicidad,precio_base,estado,observaciones,creado_por,fecha_actualizacion) VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run(empresaId,data.codigo,data.nombre,data.categoria,data.descripcion,data.modalidad,data.periodicidad,data.precio_base,data.estado,data.observaciones,req.user.id);
    audit(req,"CREAR",`Creó servicio ${data.nombre}`,empresaId);
    res.status(201).json({ok:true,id:Number(result.lastInsertRowid)});
  }catch(err){
    if(String(err.message||"").includes("UNIQUE")) return res.status(409).json({error:"Ya existe un servicio con ese código en la empresa"});
    res.status(409).json({error:"No fue posible crear el servicio"});
  }
});

r.put("/:id", requireAuth, requirePermission("servicios.editar"), (req,res)=>{
  const id=Number(req.params.id), current=service(id);
  if(!allowed(req,current)) return res.status(404).json({error:"Servicio no encontrado"});
  const data=normalize(req.body);
  if(!data.nombre) return res.status(400).json({error:"Nombre del servicio obligatorio"});
  if(!Number.isFinite(data.precio_base)||data.precio_base<0) return res.status(400).json({error:"Precio base no válido"});
  try{
    db.prepare(`UPDATE servicios SET codigo=?,nombre=?,categoria=?,descripcion=?,modalidad=?,periodicidad=?,precio_base=?,estado=?,observaciones=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`).run(data.codigo,data.nombre,data.categoria,data.descripcion,data.modalidad,data.periodicidad,data.precio_base,data.estado,data.observaciones,id);
    audit(req,"EDITAR",`Editó servicio ${id} — ${data.nombre}`,current.empresa_id);
    res.json({ok:true});
  }catch(err){
    if(String(err.message||"").includes("UNIQUE")) return res.status(409).json({error:"Ya existe un servicio con ese código en la empresa"});
    res.status(409).json({error:"No fue posible actualizar el servicio"});
  }
});

r.delete("/:id", requireAuth, requirePermission("servicios.eliminar"), (req,res)=>{
  const id=Number(req.params.id), current=service(id);
  if(!allowed(req,current)) return res.status(404).json({error:"Servicio no encontrado"});
  db.prepare("UPDATE servicios SET estado=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(current.estado?0:1,id);
  audit(req,current.estado?"DESACTIVAR":"ACTIVAR",`${current.estado?"Desactivó":"Activó"} servicio ${id} — ${current.nombre}`,current.empresa_id);
  res.json({ok:true,estado:current.estado?0:1});
});

export default r;
