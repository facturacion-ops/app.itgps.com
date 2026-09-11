import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { buildDocumentModel, renderDocumentHtml } from "../services_documentRenderer.js";

const r = Router();
const isAdmin = u => u.rol === "Administrador";
const types = ["REPORTE","COTIZACION","FACTURA","CONTRATO","ORDEN_SERVICIO"];
function companyId(req, requested) {
  const id = Number(requested || 0);
  return isAdmin(req.user) && id ? id : req.user.empresa_id;
}
function canAccess(req, id) { return isAdmin(req.user) || Number(id) === Number(req.user.empresa_id); }
function audit(req, empresaId, accion, detalle) {
  try { db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)").run(empresaId, req.user.id, accion, "PLANTILLAS_DOCUMENTOS", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent") || ""); } catch {}
}
function cleanConfig(value) {
  let cfg = value;
  if (typeof value === "string") { try { cfg = JSON.parse(value); } catch { cfg = {}; } }
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) cfg = {};
  const allowed = ["margen_mm","orientacion","mostrar_logo","mostrar_empresa","mostrar_cliente","mostrar_titulo","mostrar_numero","mostrar_fecha","mostrar_tabla","mostrar_totales","mostrar_firma","mostrar_legal","mostrar_bancarios","mostrar_pie","fuente","tamano_fuente"];
  const out = {};
  for (const k of allowed) if (Object.prototype.hasOwnProperty.call(cfg,k)) out[k] = cfg[k];
  return out;
}
function row(id) {
  const x = db.prepare(`SELECT p.*,e.nombre empresa,e.nit FROM plantillas_documentos p JOIN empresas e ON e.id=p.empresa_id WHERE p.id=?`).get(id);
  if (!x) return null;
  try { x.configuracion = JSON.parse(x.configuracion || "{}"); } catch { x.configuracion = {}; }
  return x;
}

r.get("/filtros", requireAuth, requirePermission("plantillas_documentos.ver"), (req,res) => {
  const empresas = isAdmin(req.user) ? db.prepare("SELECT id,nombre,nit FROM empresas WHERE estado=1 ORDER BY nombre").all() : [];
  res.json({ empresas, tipos: types });
});

r.get("/", requireAuth, requirePermission("plantillas_documentos.ver"), (req,res) => {
  const cid = companyId(req, req.query.empresa_id);
  const tipo = String(req.query.tipo || "").toUpperCase();
  const estado = req.query.estado;
  const p=[cid]; let sql=`SELECT p.*,e.nombre empresa FROM plantillas_documentos p JOIN empresas e ON e.id=p.empresa_id WHERE p.empresa_id=?`;
  if (tipo && types.includes(tipo)) { sql += " AND p.tipo_documento=?"; p.push(tipo); }
  if (estado !== undefined && estado !== "") { sql += " AND p.estado=?"; p.push(Number(estado) ? 1 : 0); }
  sql += " ORDER BY p.tipo_documento,p.predeterminada DESC,p.nombre";
  res.json({ plantillas: db.prepare(sql).all(...p).map(x => ({...x, configuracion: (()=>{try{return JSON.parse(x.configuracion||"{}")}catch{return {}}})()})) });
});

r.get("/:id", requireAuth, requirePermission("plantillas_documentos.ver"), (req,res) => {
  const x=row(Number(req.params.id));
  if (!x || !canAccess(req,x.empresa_id)) return res.status(404).json({error:"Plantilla no encontrada"});
  res.json({ plantilla:x });
});

r.post("/", requireAuth, requirePermission("plantillas_documentos.crear"), (req,res) => {
  const body=req.body||{}, cid=companyId(req,body.empresa_id);
  if (!canAccess(req,cid)) return res.status(403).json({error:"No puede crear una plantilla para otra empresa"});
  const nombre=String(body.nombre||"").trim(); const tipo=String(body.tipo_documento||"REPORTE").toUpperCase();
  if (!nombre) return res.status(400).json({error:"El nombre de la plantilla es obligatorio"});
  if (!types.includes(tipo)) return res.status(400).json({error:"Tipo de documento no válido"});
  const config=cleanConfig(body.configuracion); const tx=db.transaction(()=>{
    if (Number(body.predeterminada)) db.prepare("UPDATE plantillas_documentos SET predeterminada=0,fecha_actualizacion=CURRENT_TIMESTAMP WHERE empresa_id=? AND tipo_documento=?").run(cid,tipo);
    const result=db.prepare("INSERT INTO plantillas_documentos(empresa_id,nombre,tipo_documento,descripcion,estado,predeterminada,configuracion,creado_por) VALUES(?,?,?,?,?,?,?,?)").run(cid,nombre,tipo,String(body.descripcion||"").trim(),Number(body.estado)!==0?1:0,Number(body.predeterminada)?1:0,JSON.stringify(config),req.user.id);
    return Number(result.lastInsertRowid);
  });
  const id=tx(); audit(req,cid,"CREAR",`Creó plantilla ${id} (${tipo})`); res.status(201).json({ok:true,plantilla:row(id)});
});

r.put("/:id", requireAuth, requirePermission("plantillas_documentos.editar"), (req,res) => {
  const id=Number(req.params.id), cur=row(id); if (!cur || !canAccess(req,cur.empresa_id)) return res.status(404).json({error:"Plantilla no encontrada"});
  const body=req.body||{}, nombre=String(body.nombre??cur.nombre).trim(), tipo=String(body.tipo_documento??cur.tipo_documento).toUpperCase();
  if (!nombre) return res.status(400).json({error:"El nombre de la plantilla es obligatorio"});
  if (!types.includes(tipo)) return res.status(400).json({error:"Tipo de documento no válido"});
  const config=cleanConfig(body.configuracion??cur.configuracion); const tx=db.transaction(()=>{
    if (Number(body.predeterminada)) db.prepare("UPDATE plantillas_documentos SET predeterminada=0,fecha_actualizacion=CURRENT_TIMESTAMP WHERE empresa_id=? AND tipo_documento=? AND id<>?").run(cur.empresa_id,tipo,id);
    db.prepare("UPDATE plantillas_documentos SET nombre=?,tipo_documento=?,descripcion=?,estado=?,predeterminada=?,configuracion=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(nombre,tipo,String(body.descripcion ?? cur.descripcion ?? "").trim(),Number(body.estado)!==0?1:0,Number(body.predeterminada)?1:0,JSON.stringify(config),id);
  });
  tx(); audit(req,cur.empresa_id,"EDITAR",`Editó plantilla ${id}`); res.json({ok:true,plantilla:row(id)});
});

r.patch("/:id/predeterminada", requireAuth, requirePermission("plantillas_documentos.editar"), (req,res) => {
  const id=Number(req.params.id), cur=row(id); if (!cur || !canAccess(req,cur.empresa_id)) return res.status(404).json({error:"Plantilla no encontrada"});
  const tx=db.transaction(()=>{ db.prepare("UPDATE plantillas_documentos SET predeterminada=0,fecha_actualizacion=CURRENT_TIMESTAMP WHERE empresa_id=? AND tipo_documento=?").run(cur.empresa_id,cur.tipo_documento); db.prepare("UPDATE plantillas_documentos SET predeterminada=1,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(id); }); tx(); audit(req,cur.empresa_id,"EDITAR",`Marcó plantilla ${id} como predeterminada`); res.json({ok:true,plantilla:row(id)});
});

r.delete("/:id", requireAuth, requirePermission("plantillas_documentos.eliminar"), (req,res) => {
  const id=Number(req.params.id), cur=row(id); if (!cur || !canAccess(req,cur.empresa_id)) return res.status(404).json({error:"Plantilla no encontrada"});
  db.prepare("DELETE FROM plantillas_documentos WHERE id=?").run(id); audit(req,cur.empresa_id,"ELIMINAR",`Eliminó plantilla ${id}`); res.json({ok:true});
});

r.get("/:id/preview", requireAuth, requirePermission("plantillas_documentos.ver"), (req,res) => {
  const cur=row(Number(req.params.id)); if (!cur || !canAccess(req,cur.empresa_id)) return res.status(404).send("Plantilla no encontrada");
  const model=buildDocumentModel({empresaId:cur.empresa_id,tipo:cur.tipo_documento,titulo:cur.nombre,numero:`PLT-${String(cur.id).padStart(4,"0")}`,rows:[{concepto:"Plantilla documental",estado:cur.estado?"Activa":"Inactiva",resultado:cur.predeterminada?"Predeterminada":"Disponible"}]});
  if (!model) return res.status(404).send("Empresa no encontrada o inactiva");
  audit(req,cur.empresa_id,"VISTA_PREVIA",`Generó vista previa de plantilla ${cur.id}`); res.type("html").send(renderDocumentHtml(model));
});

export default r;
