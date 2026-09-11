import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const isAdmin = (u) => u.rol === "Administrador";

function audit(req, accion, detalle, empresaId = req.user.empresa_id) {
  db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(empresaId, req.user.id, accion, "ACTIVOS", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent")||"");
}

function normalize(body = {}) {
  return {
    codigo: String(body.codigo || "").trim(),
    placa: String(body.placa || "").trim().toUpperCase(),
    tipo_activo: String(body.tipo_activo || "Vehículo").trim(),
    marca: String(body.marca || "").trim(),
    linea: String(body.linea || "").trim(),
    modelo: String(body.modelo || "").trim(),
    anio: body.anio ? Number(body.anio) : null,
    color: String(body.color || "").trim(),
    vin: String(body.vin || "").trim().toUpperCase(),
    numero_motor: String(body.numero_motor || "").trim(),
    estado: String(body.estado || "Activo").trim(),
    fecha_alta: String(body.fecha_alta || "").trim(),
    fecha_baja: String(body.fecha_baja || "").trim(),
    observaciones: String(body.observaciones || "").trim()
  };
}

function getAsset(id) {
  return db.prepare(`
    SELECT a.*, c.nombre cliente, c.nit cliente_nit, e.nombre empresa,
           COALESCE(u.nombre || ' ' || u.apellido, '') creado_por_nombre
    FROM activos a
    JOIN clientes c ON c.id=a.cliente_id
    JOIN empresas e ON e.id=a.empresa_id
    LEFT JOIN usuarios u ON u.id=a.creado_por
    WHERE a.id=?
  `).get(id);
}

r.get("/catalogos", requireAuth, requirePermission("activos.crear"), (req, res) => {
  const requestedCompanyId = Number(req.query.empresa_id || 0);
  if (isAdmin(req.user)) {
    const empresas = db.prepare("SELECT id,nombre,nit,estado FROM empresas WHERE estado=1 ORDER BY nombre").all();
    if (!requestedCompanyId) return res.json({ empresas, clientes: [] });
    const empresa = empresas.find(x => x.id === requestedCompanyId);
    if (!empresa) return res.status(400).json({ error: "Empresa no válida o inactiva" });
    const clientes = db.prepare("SELECT id,nombre,nit FROM clientes WHERE empresa_id=? AND estado=1 ORDER BY nombre").all(requestedCompanyId);
    return res.json({ empresas, clientes });
  }
  const empresa = db.prepare("SELECT id,nombre,nit,estado FROM empresas WHERE id=? AND estado=1").get(req.user.empresa_id);
  if (!empresa) return res.status(400).json({ error: "Empresa del usuario no válida o inactiva" });
  const clientes = db.prepare("SELECT id,nombre,nit FROM clientes WHERE empresa_id=? AND estado=1 ORDER BY nombre").all(req.user.empresa_id);
  res.json({ empresas: [empresa], clientes });
});

function companyAndClientValid(empresaId, clienteId) {
  return db.prepare(`
    SELECT c.id, c.nombre
    FROM clientes c
    WHERE c.id=? AND c.empresa_id=? AND c.estado=1
  `).get(clienteId, empresaId);
}

r.get("/export", requireAuth, requirePermission("activos.exportar"), (req, res) => {
  const empresaId = isAdmin(req.user) && Number(req.query.empresa_id) ? Number(req.query.empresa_id) : req.user.empresa_id;
  const q = String(req.query.q || "").trim();
  const estado = String(req.query.estado || "").trim();
  const params = [empresaId];
  let sql = `SELECT a.codigo,a.placa,a.tipo_activo,a.marca,a.linea,a.modelo,a.anio,a.color,a.vin,a.numero_motor,
    a.estado,a.fecha_alta,a.fecha_baja,c.nombre cliente,e.nombre empresa,a.observaciones
    FROM activos a JOIN clientes c ON c.id=a.cliente_id JOIN empresas e ON e.id=a.empresa_id WHERE a.empresa_id=?`;
  if(q){sql += ` AND (a.codigo LIKE ? OR a.placa LIKE ? OR a.marca LIKE ? OR a.modelo LIKE ? OR c.nombre LIKE ?)`; const like=`%${q}%`; params.push(like,like,like,like,like);}
  if(estado){sql += " AND a.estado=?"; params.push(estado);}
  sql += " ORDER BY a.placa,a.codigo";
  const rows=db.prepare(sql).all(...params);
  const headers=["codigo","placa","tipo_activo","marca","linea","modelo","anio","color","vin","numero_motor","estado","fecha_alta","fecha_baja","cliente","empresa","observaciones"];
  const cell=v=>`"${String(v ?? "").replaceAll('"','""')}"`;
  const csv=[headers.join(","),...rows.map(x=>headers.map(h=>cell(x[h])).join(","))].join("\n");
  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader("Content-Disposition",`attachment; filename="activos-itgps-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send("\ufeff"+csv);
});

r.get("/", requireAuth, requirePermission("activos.ver"), (req,res)=>{
  const empresaId=isAdmin(req.user)&&Number(req.query.empresa_id)?Number(req.query.empresa_id):req.user.empresa_id;
  const q=String(req.query.q||"").trim(); const estado=String(req.query.estado||"").trim();
  const params=[empresaId];
  let sql=`SELECT a.*,c.nombre cliente,e.nombre empresa FROM activos a JOIN clientes c ON c.id=a.cliente_id JOIN empresas e ON e.id=a.empresa_id WHERE a.empresa_id=?`;
  if(q){sql+=` AND (a.codigo LIKE ? OR a.placa LIKE ? OR a.marca LIKE ? OR a.linea LIKE ? OR a.modelo LIKE ? OR a.vin LIKE ? OR c.nombre LIKE ?)`; const like=`%${q}%`; params.push(like,like,like,like,like,like,like);}
  if(estado){sql+=" AND a.estado=?";params.push(estado);}
  sql+=" ORDER BY a.placa,a.codigo LIMIT 2000";
  res.json({activos:db.prepare(sql).all(...params)});
});

r.get("/:id", requireAuth, requirePermission("activos.ver"), (req,res)=>{
  const a=getAsset(Number(req.params.id)); if(!a)return res.status(404).json({error:"Activo no encontrado"});
  if(!isAdmin(req.user)&&a.empresa_id!==req.user.empresa_id)return res.status(404).json({error:"Activo no encontrado"});
  res.json({activo:a});
});

r.post("/", requireAuth, requirePermission("activos.crear"), (req,res)=>{
  const data=normalize(req.body); if(!data.codigo && !data.placa)return res.status(400).json({error:"Código o placa obligatorio"});
  const empresaId=isAdmin(req.user)&&Number(req.body?.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id;
  const company=db.prepare("SELECT id FROM empresas WHERE id=? AND estado=1").get(empresaId); if(!company)return res.status(400).json({error:"Empresa no válida o inactiva"});
  const clienteId=Number(req.body?.cliente_id);
  if(!clienteId || !Number.isFinite(clienteId))return res.status(400).json({error:"Debe seleccionar un cliente"});
  const client=companyAndClientValid(empresaId,clienteId); if(!client)return res.status(400).json({error:"Cliente no válido para la empresa seleccionada"});
  if(data.anio && (data.anio<1900 || data.anio>new Date().getFullYear()+2))return res.status(400).json({error:"Año del activo no válido"});
  try {
    const x=db.prepare(`INSERT INTO activos(empresa_id,cliente_id,codigo,placa,tipo_activo,marca,linea,modelo,anio,color,vin,numero_motor,estado,fecha_alta,fecha_baja,observaciones,creado_por,fecha_actualizacion) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run(empresaId,clienteId,data.codigo,data.placa,data.tipo_activo,data.marca,data.linea,data.modelo,data.anio,data.color,data.vin,data.numero_motor,data.estado,data.fecha_alta,data.fecha_baja,data.observaciones,req.user.id);
    audit(req,"CREAR",`Creó activo ${data.placa||data.codigo} - cliente ${client.nombre}`,empresaId);
    res.status(201).json({ok:true,id:Number(x.lastInsertRowid)});
  } catch(e){console.error("[activos.crear] Error al insertar:",e.message);res.status(409).json({error:"No fue posible crear el activo"});}
});

r.put("/:id", requireAuth, requirePermission("activos.editar"), (req,res)=>{
  const id=Number(req.params.id); const current=getAsset(id); if(!current)return res.status(404).json({error:"Activo no encontrado"});
  if(!isAdmin(req.user)&&current.empresa_id!==req.user.empresa_id)return res.status(404).json({error:"Activo no encontrado"});
  const data=normalize(req.body); if(!data.codigo&&!data.placa)return res.status(400).json({error:"Código o placa obligatorio"});
  const empresaId=isAdmin(req.user)&&Number(req.body?.empresa_id)?Number(req.body.empresa_id):current.empresa_id;
  const company=db.prepare("SELECT id FROM empresas WHERE id=? AND estado=1").get(empresaId); if(!company)return res.status(400).json({error:"Empresa no válida o inactiva"});
  const clienteId=Number(req.body?.cliente_id);
  if(!clienteId || !Number.isFinite(clienteId))return res.status(400).json({error:"Debe seleccionar un cliente"});
  const client=companyAndClientValid(empresaId,clienteId); if(!client)return res.status(400).json({error:"Cliente no válido para la empresa seleccionada"});
  try {
    db.prepare(`UPDATE activos SET empresa_id=?,cliente_id=?,codigo=?,placa=?,tipo_activo=?,marca=?,linea=?,modelo=?,anio=?,color=?,vin=?,numero_motor=?,estado=?,fecha_alta=?,fecha_baja=?,observaciones=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`).run(empresaId,clienteId,data.codigo,data.placa,data.tipo_activo,data.marca,data.linea,data.modelo,data.anio,data.color,data.vin,data.numero_motor,data.estado,data.fecha_alta,data.fecha_baja,data.observaciones,id);
    audit(req,"EDITAR",`Editó activo ${id} - ${data.placa||data.codigo}`,empresaId); res.json({ok:true});
  } catch(e){console.error("[activos.editar] Error al actualizar:",e.message);res.status(409).json({error:"No fue posible actualizar el activo"});}
});

r.delete("/:id", requireAuth, requirePermission("activos.eliminar"), (req,res)=>{
  const id=Number(req.params.id); const current=getAsset(id); if(!current)return res.status(404).json({error:"Activo no encontrado"});
  if(!isAdmin(req.user)&&current.empresa_id!==req.user.empresa_id)return res.status(404).json({error:"Activo no encontrado"});
  db.prepare("DELETE FROM activos WHERE id=?").run(id); audit(req,"ELIMINAR",`Eliminó activo ${id} - ${current.placa||current.codigo}`,current.empresa_id); res.json({ok:true});
});

export default r;
