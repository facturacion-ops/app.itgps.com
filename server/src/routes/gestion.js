import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const admin = u => u.rol === "Administrador";
const companyId = req => {
  const requested = Number(req.query.empresa_id || req.body?.empresa_id || 0);
  return admin(req.user) && requested ? requested : req.user.empresa_id;
};

function audit(req, accion, detalle, entidad_id=null, antes="", despues="") {
  db.prepare(`INSERT INTO auditoria
    (empresa_id,usuario_id,accion,modulo,detalle,ip,metodo,ruta,user_agent,entidad,entidad_id,datos_antes,datos_despues)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    req.user.empresa_id, req.user.id, accion, "gestion", detalle,
    req.ip || "", req.method, req.originalUrl || "", req.get("user-agent") || "",
    "gestion", entidad_id, antes ? JSON.stringify(antes) : "", despues ? JSON.stringify(despues) : ""
  );
}

function getTask(id) {
  return db.prepare(`SELECT g.*, e.nombre empresa, c.nombre cliente, a.codigo activo,
    a.placa, eq.imei, s.iccid, u.nombre responsable_nombre, u.apellido responsable_apellido
    FROM gestion_tareas g
    JOIN empresas e ON e.id=g.empresa_id
    LEFT JOIN clientes c ON c.id=g.cliente_id
    LEFT JOIN activos a ON a.id=g.activo_id
    LEFT JOIN equipos eq ON eq.id=g.equipo_id
    LEFT JOIN sim_cards s ON s.id=g.sim_id
    LEFT JOIN usuarios u ON u.id=g.responsable_id
    WHERE g.id=?`).get(id);
}

function validCompany(req, id) {
  const row = db.prepare("SELECT id FROM empresas WHERE id=? AND estado=1").get(id);
  return row && (admin(req.user) || id === req.user.empresa_id);
}

r.get("/catalogos", requireAuth, requirePermission("gestion.ver"), (req,res)=>{
  const cid = admin(req.user) && Number(req.query.empresa_id) ? Number(req.query.empresa_id) : req.user.empresa_id;
  const empresas = admin(req.user) ? db.prepare("SELECT id,nombre FROM empresas WHERE estado=1 ORDER BY nombre").all() : [];
  const usuarios = db.prepare("SELECT id,nombre,apellido,correo FROM usuarios WHERE empresa_id=? AND estado=1 ORDER BY nombre,apellido").all(cid);
  const clientes = db.prepare("SELECT id,nombre,codigo FROM clientes WHERE empresa_id=? AND estado=1 ORDER BY nombre").all(cid);
  const activos = db.prepare("SELECT activos.id,activos.codigo,activos.placa FROM activos WHERE activos.empresa_id=? ORDER BY codigo").all(cid);
  const equipos = db.prepare("SELECT id,imei FROM equipos WHERE empresa_id=? ORDER BY imei").all(cid);
  const sims = db.prepare("SELECT id,iccid,numero,operador,estado FROM sim_cards WHERE empresa_id=? ORDER BY iccid").all(cid);
  res.json({empresas,usuarios,clientes,activos,equipos,sims});
});

r.get("/resumen", requireAuth, requirePermission("gestion.ver"), (req,res)=>{
  const cid = admin(req.user) && Number(req.query.empresa_id) ? Number(req.query.empresa_id) : req.user.empresa_id;
  const q=(sql,...p)=>db.prepare(sql).get(...p)?.n||0;
  res.json({resumen:{
    total:q("SELECT COUNT(*) n FROM gestion_tareas WHERE empresa_id=?",cid),
    pendientes:q("SELECT COUNT(*) n FROM gestion_tareas WHERE empresa_id=? AND estado='Pendiente'",cid),
    proceso:q("SELECT COUNT(*) n FROM gestion_tareas WHERE empresa_id=? AND estado='En proceso'",cid),
    vencidas:q("SELECT COUNT(*) n FROM gestion_tareas WHERE empresa_id=? AND estado NOT IN ('Completado','Cancelado') AND fecha_limite<>'' AND date(fecha_limite)<date('now')",cid),
    completadas:q("SELECT COUNT(*) n FROM gestion_tareas WHERE empresa_id=? AND estado='Completado'",cid)
  }});
});

r.get("/", requireAuth, requirePermission("gestion.ver"), (req,res)=>{
  const cid=admin(req.user)&&Number(req.query.empresa_id)?Number(req.query.empresa_id):req.user.empresa_id;
  const q=String(req.query.q||"").trim(), estado=String(req.query.estado||""), prioridad=String(req.query.prioridad||"");
  const desde=String(req.query.desde||""), hasta=String(req.query.hasta||"");
  const page=Math.max(1,Number(req.query.page||1)), limit=Math.min(100,Math.max(10,Number(req.query.limit||25)));
  const p=[cid]; let where="g.empresa_id=?";
  if(q){where+=" AND (g.titulo LIKE ? OR g.descripcion LIKE ? OR c.nombre LIKE ? OR a.codigo LIKE ? OR a.placa LIKE ? OR eq.imei LIKE ? OR s.iccid LIKE ?)";const x=`%${q}%`;p.push(x,x,x,x,x,x,x)}
  if(estado){where+=" AND g.estado=?";p.push(estado)}
  if(prioridad){where+=" AND g.prioridad=?";p.push(prioridad)}
  if(desde){where+=" AND date(g.fecha_limite)>=date(?)";p.push(desde)}
  if(hasta){where+=" AND date(g.fecha_limite)<=date(?)";p.push(hasta)}
  const total=db.prepare(`SELECT COUNT(*) n FROM gestion_tareas g LEFT JOIN clientes c ON c.id=g.cliente_id LEFT JOIN activos a ON a.id=g.activo_id LEFT JOIN equipos eq ON eq.id=g.equipo_id LEFT JOIN sim_cards s ON s.id=g.sim_id WHERE ${where}`).get(...p).n;
  const rows=db.prepare(`SELECT g.*,c.nombre cliente,a.codigo activo,a.placa,eq.imei,s.iccid,
    TRIM(COALESCE(u.nombre,'')||' '||COALESCE(u.apellido,'')) responsable
    FROM gestion_tareas g LEFT JOIN clientes c ON c.id=g.cliente_id LEFT JOIN activos a ON a.id=g.activo_id
    LEFT JOIN equipos eq ON eq.id=g.equipo_id LEFT JOIN sim_cards s ON s.id=g.sim_id
    LEFT JOIN usuarios u ON u.id=g.responsable_id
    WHERE ${where} ORDER BY CASE g.prioridad WHEN 'Crítica' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Media' THEN 3 ELSE 4 END,g.fecha_limite,g.id DESC LIMIT ? OFFSET ?`).all(...p,limit,(page-1)*limit);
  res.json({rows,page,limit,total,pages:Math.max(1,Math.ceil(total/limit))});
});

r.get("/:id", requireAuth, requirePermission("gestion.ver"), (req,res)=>{
  const row=getTask(Number(req.params.id));
  if(!row || (!admin(req.user)&&row.empresa_id!==req.user.empresa_id)) return res.status(404).json({error:"Gestión no encontrada"});
  res.json({gestion:row});
});

r.post("/", requireAuth, requirePermission("gestion.crear"), (req,res)=>{
  const b=req.body||{}, cid=Number(b.empresa_id||req.user.empresa_id);
  if(!validCompany(req,cid)) return res.status(403).json({error:"Empresa no permitida"});
  if(!String(b.titulo||"").trim()) return res.status(400).json({error:"El título es obligatorio"});
  const allowed=["Tarea","Actividad","Seguimiento","Pendiente","Vencimiento"];
  const estados=["Pendiente","En proceso","En espera","Completado","Cancelado"];
  const prioridades=["Baja","Media","Alta","Crítica"];
  const tipo=allowed.includes(b.tipo)?b.tipo:"Tarea", estado=estados.includes(b.estado)?b.estado:"Pendiente", prioridad=prioridades.includes(b.prioridad)?b.prioridad:"Media";
  const info=db.prepare(`INSERT INTO gestion_tareas(empresa_id,tipo,titulo,descripcion,prioridad,estado,cliente_id,activo_id,equipo_id,sim_id,responsable_id,fecha_limite,fecha_inicio,fecha_completado,observaciones,creado_por,fecha_creacion,fecha_actualizacion)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).run(cid,tipo,String(b.titulo).trim(),b.descripcion||"",prioridad,estado,
    Number(b.cliente_id)||null,Number(b.activo_id)||null,Number(b.equipo_id)||null,Number(b.sim_id)||null,Number(b.responsable_id)||null,
    b.fecha_limite||"",b.fecha_inicio||"",estado==="Completado"?(b.fecha_completado||new Date().toISOString().slice(0,10)):"",b.observaciones||"",req.user.id);
  const row=getTask(info.lastInsertRowid); audit(req,"CREAR",`Creó gestión "${row.titulo}"`,row.id,null,row); res.status(201).json({gestion:row});
});

r.put("/:id", requireAuth, requirePermission("gestion.editar"), (req,res)=>{
  const id=Number(req.params.id), before=getTask(id);
  if(!before || (!admin(req.user)&&before.empresa_id!==req.user.empresa_id)) return res.status(404).json({error:"Gestión no encontrada"});
  const b=req.body||{}, estados=["Pendiente","En proceso","En espera","Completado","Cancelado"], prioridades=["Baja","Media","Alta","Crítica"], tipos=["Tarea","Actividad","Seguimiento","Pendiente","Vencimiento"];
  const estado=estados.includes(b.estado)?b.estado:before.estado, prioridad=prioridades.includes(b.prioridad)?b.prioridad:before.prioridad, tipo=tipos.includes(b.tipo)?b.tipo:before.tipo;
  db.prepare(`UPDATE gestion_tareas SET tipo=?,titulo=?,descripcion=?,prioridad=?,estado=?,cliente_id=?,activo_id=?,equipo_id=?,sim_id=?,responsable_id=?,fecha_limite=?,fecha_inicio=?,fecha_completado=?,observaciones=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`)
    .run(tipo,String(b.titulo||before.titulo).trim(),b.descripcion??before.descripcion,prioridad,estado,Number(b.cliente_id)||null,Number(b.activo_id)||null,Number(b.equipo_id)||null,Number(b.sim_id)||null,Number(b.responsable_id)||null,b.fecha_limite??before.fecha_limite,b.fecha_inicio??before.fecha_inicio,estado==="Completado"?(b.fecha_completado||before.fecha_completado||new Date().toISOString().slice(0,10)):"",b.observaciones??before.observaciones,id);
  const after=getTask(id); audit(req,"EDITAR",`Editó gestión "${after.titulo}"`,id,before,after); res.json({gestion:after});
});

r.patch("/:id/estado", requireAuth, requirePermission("gestion.editar"), (req,res)=>{
  const id=Number(req.params.id), before=getTask(id);
  if(!before || (!admin(req.user)&&before.empresa_id!==req.user.empresa_id)) return res.status(404).json({error:"Gestión no encontrada"});
  const estados=["Pendiente","En proceso","En espera","Completado","Cancelado"], estado=estados.includes(req.body?.estado)?req.body.estado:null;
  if(!estado) return res.status(400).json({error:"Estado no válido"});
  const completed=estado==="Completado"?new Date().toISOString().slice(0,10):"";
  db.prepare("UPDATE gestion_tareas SET estado=?,fecha_completado=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(estado,completed,id);
  const after=getTask(id); audit(req,"CAMBIO_ESTADO",`Cambió estado de "${after.titulo}" a ${estado}`,id,before,after); res.json({gestion:after});
});

r.delete("/:id", requireAuth, requirePermission("gestion.eliminar"), (req,res)=>{
  const id=Number(req.params.id), before=getTask(id);
  if(!before || (!admin(req.user)&&before.empresa_id!==req.user.empresa_id)) return res.status(404).json({error:"Gestión no encontrada"});
  db.prepare("DELETE FROM gestion_tareas WHERE id=?").run(id); audit(req,"ELIMINAR",`Eliminó gestión "${before.titulo}"`,id,before,null); res.json({ok:true});
});

export default r;
