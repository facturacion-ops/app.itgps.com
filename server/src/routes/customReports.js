import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const admin = u => u.rol === "Administrador";
const SOURCES = {
  clientes: { label:"Clientes", table:"clientes", fields:["codigo","nombre","nit","tipo_cliente","contacto","telefono","correo","ciudad","estado","fecha_creacion"], labels:{codigo:"Código",nombre:"Nombre",nit:"NIT",tipo_cliente:"Tipo cliente",contacto:"Contacto",telefono:"Teléfono",correo:"Correo",ciudad:"Ciudad",estado:"Estado",fecha_creacion:"Fecha de creación"} },
  activos: { label:"Activos", table:"activos", fields:["codigo","placa","tipo_activo","marca","linea","modelo","estado","fecha_alta"], labels:{codigo:"Código",placa:"Placa",tipo_activo:"Tipo",marca:"Marca",linea:"Línea",modelo:"Modelo",estado:"Estado",fecha_alta:"Fecha de alta"} },
  equipos: { label:"Equipos GPS", table:"equipos", fields:["imei","codigo","numero_serie","fabricante","marca","modelo","tipo_dispositivo","estado","firmware"], labels:{imei:"IMEI",codigo:"Código",numero_serie:"Número de serie",fabricante:"Fabricante",marca:"Marca",modelo:"Modelo",tipo_dispositivo:"Tipo",estado:"Estado",firmware:"Firmware"} },
  sim: { label:"Tarjetas SIM", table:"sim_cards", fields:["iccid","imsi","numero","operador","estado","fecha_activacion"], labels:{iccid:"ICCID",imsi:"IMSI",numero:"Número",operador:"Operador",estado:"Estado",fecha_activacion:"Fecha de activación"} },
  m2m: { label:"Planes M2M", table:"m2m_planes", fields:["nombre","operador","mb_incluidos","costo_mensual","dia_corte","estado"], labels:{nombre:"Plan",operador:"Operador",mb_incluidos:"MB incluidos",costo_mensual:"Costo mensual",dia_corte:"Día de corte",estado:"Estado"} },
  consumo: { label:"Consumo M2M", table:"m2m_consumos", fields:["periodo","mb_consumidos"], labels:{periodo:"Período",mb_consumidos:"MB consumidos"} }
};
function cid(req, requested){ const id=Number(requested||0); return admin(req.user)&&id?id:req.user.empresa_id; }
function cleanConfig(v){ try { const x=typeof v==='string'?JSON.parse(v):v; return x&&typeof x==='object'&&!Array.isArray(x)?x:{}; } catch { return {}; } }
function access(req, empresaId){ return admin(req.user)||Number(empresaId)===Number(req.user.empresa_id); }

r.get("/catalogos", requireAuth, requirePermission("reportes_personalizados.ver"), (req,res)=>{
  const empresas=admin(req.user)?db.prepare("SELECT id,nombre,nit FROM empresas WHERE estado=1 ORDER BY nombre").all():[];
  res.json({empresas,sources:Object.entries(SOURCES).map(([id,s])=>({id,label:s.label,fields:s.fields.map(f=>({id:f,label:s.labels[f]||f}))}))});
});
r.get("/", requireAuth, requirePermission("reportes_personalizados.ver"), (req,res)=>{
  const empresa=cid(req,req.query.empresa_id);
  const rows=db.prepare("SELECT r.*,e.nombre empresa FROM reportes_personalizados r JOIN empresas e ON e.id=r.empresa_id WHERE r.empresa_id=? ORDER BY r.nombre").all(empresa);
  res.json({reportes:rows.map(x=>({...x,configuracion:cleanConfig(x.configuracion)}))});
});
r.get("/:id", requireAuth, requirePermission("reportes_personalizados.ver"), (req,res)=>{
  const x=db.prepare("SELECT r.*,e.nombre empresa FROM reportes_personalizados r JOIN empresas e ON e.id=r.empresa_id WHERE r.id=?").get(Number(req.params.id));
  if(!x||!access(req,x.empresa_id)) return res.status(404).json({error:"Reporte personalizado no encontrado"});
  res.json({reporte:{...x,configuracion:cleanConfig(x.configuracion)}});
});
r.post("/", requireAuth, requirePermission("reportes_personalizados.crear"), (req,res)=>{
  const empresa=cid(req,req.body.empresa_id); const source=SOURCES[req.body.fuente];
  if(!source) return res.status(400).json({error:"Fuente de datos no válida"});
  const campos=(Array.isArray(req.body.configuracion?.campos)?req.body.configuracion.campos:[]).filter(x=>source.fields.includes(x));
  if(!campos.length) return res.status(400).json({error:"Seleccione al menos un campo"});
  const cfg={campos,filtros:Array.isArray(req.body.configuracion?.filtros)?req.body.configuracion.filtros:[],orden:req.body.configuracion?.orden||"",direccion:req.body.configuracion?.direccion==="desc"?"desc":"asc"};
  const info=db.prepare("INSERT INTO reportes_personalizados(empresa_id,nombre,descripcion,fuente,estado,configuracion,creado_por) VALUES(?,?,?,?,1,?,?)").run(empresa,String(req.body.nombre||"").trim(),String(req.body.descripcion||""),req.body.fuente,JSON.stringify(cfg),req.user.id);
  res.status(201).json({reporte:{id:info.lastInsertRowid}});
});
r.put("/:id", requireAuth, requirePermission("reportes_personalizados.editar"), (req,res)=>{
  const old=db.prepare("SELECT * FROM reportes_personalizados WHERE id=?").get(Number(req.params.id));
  if(!old||!access(req,old.empresa_id)) return res.status(404).json({error:"Reporte personalizado no encontrado"});
  const source=SOURCES[req.body.fuente]; if(!source) return res.status(400).json({error:"Fuente de datos no válida"});
  const campos=(Array.isArray(req.body.configuracion?.campos)?req.body.configuracion.campos:[]).filter(x=>source.fields.includes(x));
  if(!campos.length) return res.status(400).json({error:"Seleccione al menos un campo"});
  const cfg={campos,filtros:Array.isArray(req.body.configuracion?.filtros)?req.body.configuracion.filtros:[],orden:req.body.configuracion?.orden||"",direccion:req.body.configuracion?.direccion==="desc"?"desc":"asc"};
  db.prepare("UPDATE reportes_personalizados SET nombre=?,descripcion=?,fuente=?,estado=?,configuracion=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(String(req.body.nombre||"").trim(),String(req.body.descripcion||""),req.body.fuente,Number(req.body.estado??1)?1:0,JSON.stringify(cfg),old.id);
  res.json({ok:true});
});
r.patch("/:id/estado", requireAuth, requirePermission("reportes_personalizados.editar"), (req,res)=>{
  const x=db.prepare("SELECT * FROM reportes_personalizados WHERE id=?").get(Number(req.params.id)); if(!x||!access(req,x.empresa_id))return res.status(404).json({error:"Reporte no encontrado"});
  db.prepare("UPDATE reportes_personalizados SET estado=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(Number(req.body.estado)?1:0,x.id); res.json({ok:true});
});
r.delete("/:id", requireAuth, requirePermission("reportes_personalizados.eliminar"), (req,res)=>{ const x=db.prepare("SELECT * FROM reportes_personalizados WHERE id=?").get(Number(req.params.id)); if(!x||!access(req,x.empresa_id))return res.status(404).json({error:"Reporte no encontrado"}); db.prepare("DELETE FROM reportes_personalizados WHERE id=?").run(x.id); res.json({ok:true}); });

r.post("/:id/preview", requireAuth, requirePermission("reportes_personalizados.ver"), (req,res)=>{
  const x=db.prepare("SELECT * FROM reportes_personalizados WHERE id=?").get(Number(req.params.id)); if(!x||!access(req,x.empresa_id))return res.status(404).json({error:"Reporte no encontrado"});
  const source=SOURCES[x.fuente], cfg=cleanConfig(x.configuracion), fields=(cfg.campos||[]).filter(f=>source.fields.includes(f));
  const empresa=x.empresa_id;
  const label=source.labels;
  let rows=[];
  if(x.fuente==='clientes') rows=db.prepare(`SELECT ${fields.join(',')} FROM clientes WHERE empresa_id=? ORDER BY nombre LIMIT 100`).all(empresa);
  else if(x.fuente==='activos') rows=db.prepare(`SELECT ${fields.join(',')} FROM activos WHERE empresa_id=? ORDER BY codigo LIMIT 100`).all(empresa);
  else if(x.fuente==='equipos') rows=db.prepare(`SELECT ${fields.join(',')} FROM equipos WHERE empresa_id=? ORDER BY imei LIMIT 100`).all(empresa);
  else if(x.fuente==='sim') rows=db.prepare(`SELECT ${fields.join(',')} FROM sim_cards WHERE empresa_id=? ORDER BY iccid LIMIT 100`).all(empresa);
  else if(x.fuente==='m2m') rows=db.prepare(`SELECT ${fields.join(',')} FROM m2m_planes WHERE empresa_id=? ORDER BY nombre LIMIT 100`).all(empresa);
  else if(x.fuente==='consumo') rows=db.prepare(`SELECT ${fields.join(',')} FROM m2m_consumos m JOIN sim_cards s ON s.id=m.sim_id WHERE s.empresa_id=? ORDER BY m.periodo DESC LIMIT 100`).all(empresa);
  res.json({reporte:{id:x.id,nombre:x.nombre,fuente:x.fuente,fuente_nombre:source.label,campos:fields.map(f=>({id:f,label:label[f]||f})),rows}});
});
export default r;
