import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const isAdmin = (u) => u.rol === "Administrador";

function audit(req, accion, detalle, empresaId = req.user.empresa_id) {
  db.prepare(
    "INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)"
  ).run(empresaId, req.user.id, accion, "CLIENTES", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent")||"");
}

function normalize(body = {}) {
  return {
    codigo: String(body.codigo || "").trim(),
    nombre: String(body.nombre || "").trim(),
    nit: String(body.nit || "").trim(),
    tipo_cliente: String(body.tipo_cliente || "Empresa").trim(),
    contacto: String(body.contacto || "").trim(),
    telefono: String(body.telefono || "").trim(),
    correo: String(body.correo || "").trim().toLowerCase(),
    direccion: String(body.direccion || "").trim(),
    ciudad: String(body.ciudad || "").trim(),
    observaciones: String(body.observaciones || "").trim(),
    razon_social: String(body.razon_social || "").trim(),
    nombre_comercial: String(body.nombre_comercial || "").trim(),
    digito_verificacion: String(body.digito_verificacion || "").trim(),
    actividad_economica: String(body.actividad_economica || "").trim(),
    departamento: String(body.departamento || "").trim(),
    sitio_web: String(body.sitio_web || "").trim(),
    estado: Number(body.estado) ? 1 : 0
  };
}

function getClient(id) {
  return db.prepare(`
    SELECT c.*, e.nombre empresa,
           COALESCE(u.nombre || ' ' || u.apellido, '') creado_por_nombre
    FROM clientes c
    JOIN empresas e ON e.id = c.empresa_id
    LEFT JOIN usuarios u ON u.id = c.creado_por
    WHERE c.id=?
  `).get(id);
}

r.get("/export", requireAuth, requirePermission("clientes.exportar"), (req, res) => {
  const isAdministrator = isAdmin(req.user);
  const q = String(req.query.q || "").trim();
  const estado = req.query.estado === "0" ? 0 : req.query.estado === "1" ? 1 : null;
  const empresaId = isAdministrator && req.query.empresa_id ? Number(req.query.empresa_id) : req.user.empresa_id;
  const params = [empresaId];
  let sql = `SELECT c.codigo,c.nombre,c.nit,c.tipo_cliente,c.contacto,c.telefono,c.correo,c.direccion,c.ciudad,c.departamento,c.razon_social,c.nombre_comercial,c.digito_verificacion,c.actividad_economica,c.sitio_web,
                    CASE WHEN c.estado=1 THEN 'Activo' ELSE 'Inactivo' END estado,
                    e.nombre empresa,c.observaciones,c.fecha_creacion,c.fecha_actualizacion
             FROM clientes c JOIN empresas e ON e.id=c.empresa_id WHERE c.empresa_id=?`;
  if (q) {
    sql += ` AND (c.codigo LIKE ? OR c.nombre LIKE ? OR c.nit LIKE ? OR c.contacto LIKE ? OR c.correo LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }
  if (estado !== null) { sql += " AND c.estado=?"; params.push(estado); }
  sql += " ORDER BY c.nombre";
  const rows = db.prepare(sql).all(...params);
  const headers = ["codigo","nombre","nit","digito_verificacion","razon_social","nombre_comercial","tipo_cliente","actividad_economica","departamento","sitio_web","contacto","telefono","correo","direccion","ciudad","estado","empresa","observaciones","fecha_creacion","fecha_actualizacion"];
  const csvCell = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.join(","), ...rows.map(row => headers.map(h => csvCell(row[h])).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="clientes-itgps-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send("\ufeff" + csv);
});

r.get("/", requireAuth, requirePermission("clientes.ver"), (req, res) => {
  const isAdministrator = isAdmin(req.user);
  const q = String(req.query.q || "").trim();
  const estado = req.query.estado === "0" ? 0 : req.query.estado === "1" ? 1 : null;
  const requestedCompany = Number(req.query.empresa_id || 0);
  const empresaId = isAdministrator && requestedCompany ? requestedCompany : req.user.empresa_id;
  const params = [empresaId];
  let sql = `SELECT c.id,c.empresa_id,c.codigo,c.nombre,c.nit,c.tipo_cliente,c.contacto,c.telefono,c.correo,
                    c.direccion,c.ciudad,c.departamento,c.razon_social,c.nombre_comercial,c.digito_verificacion,c.actividad_economica,c.sitio_web,c.estado,c.observaciones,c.creado_por,c.fecha_creacion,c.fecha_actualizacion,
                    e.nombre empresa
             FROM clientes c JOIN empresas e ON e.id=c.empresa_id
             WHERE c.empresa_id=?`;
  if (q) {
    sql += ` AND (c.codigo LIKE ? OR c.nombre LIKE ? OR c.nit LIKE ? OR c.contacto LIKE ? OR c.telefono LIKE ? OR c.correo LIKE ? OR c.ciudad LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like, like, like, like, like);
  }
  if (estado !== null) { sql += " AND c.estado=?"; params.push(estado); }
  sql += " ORDER BY c.nombre LIMIT 1000";
  res.json({ clientes: db.prepare(sql).all(...params) });
});

r.get("/:id/resumen", requireAuth, requirePermission("clientes.ver"), (req,res)=>{
  const clienteId=Number(req.params.id);
  const client=getClient(clienteId);
  if(!client || (!isAdmin(req.user) && client.empresa_id!==req.user.empresa_id)) return res.status(404).json({error:"Cliente no encontrado"});
  const resumen=db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM activos a WHERE a.cliente_id=? AND a.estado<>'Retirado') activos,
      (SELECT COUNT(*) FROM equipos e JOIN activos a ON a.id=e.activo_id WHERE a.cliente_id=? AND e.estado<>'Retirado') equipos,
      (SELECT COUNT(*) FROM sim_cards s JOIN equipos e ON e.id=s.equipo_id JOIN activos a ON a.id=e.activo_id WHERE a.cliente_id=? AND s.estado<>'Baja') sims,
      (SELECT COUNT(*) FROM cliente_contactos cc WHERE cc.cliente_id=? AND cc.estado=1) contactos
  `).get(clienteId,clienteId,clienteId,clienteId);
  res.json({cliente:client,resumen:{...resumen,servicios:0,contratos:0,suscripciones:0},modulos:{servicios:false,contratos:false,suscripciones:false}});
});

r.get("/:id", requireAuth, requirePermission("clientes.ver"), (req, res) => {
  const client = getClient(Number(req.params.id));
  if (!client) return res.status(404).json({ error: "Cliente no encontrado" });
  if (!isAdmin(req.user) && client.empresa_id !== req.user.empresa_id) {
    return res.status(404).json({ error: "Cliente no encontrado" });
  }
  res.json({ cliente: client });
});

r.post("/", requireAuth, requirePermission("clientes.crear"), (req, res) => {
  const data = normalize(req.body);
  if (!data.nombre) return res.status(400).json({ error: "Nombre del cliente obligatorio" });
  const empresaId = isAdmin(req.user) && Number(req.body?.empresa_id) ? Number(req.body.empresa_id) : req.user.empresa_id;
  const company = db.prepare("SELECT id FROM empresas WHERE id=? AND estado=1").get(empresaId);
  if (!company) return res.status(400).json({ error: "Empresa no válida o inactiva" });
  if (data.correo && !/^\S+@\S+\.\S+$/.test(data.correo)) return res.status(400).json({ error: "Correo electrónico no válido" });

  try {
    const result = db.prepare(`
      INSERT INTO clientes
      (empresa_id,codigo,nombre,nit,tipo_cliente,contacto,telefono,correo,direccion,ciudad,departamento,razon_social,nombre_comercial,digito_verificacion,actividad_economica,sitio_web,estado,observaciones,creado_por,fecha_actualizacion)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    `).run(
      empresaId,data.codigo,data.nombre,data.nit,data.tipo_cliente,data.contacto,data.telefono,
      data.correo,data.direccion,data.ciudad,data.departamento,data.razon_social,data.nombre_comercial,data.digito_verificacion,data.actividad_economica,data.sitio_web,data.estado,data.observaciones,req.user.id
    );
    const clienteId = Number(result.lastInsertRowid);
    // Si al crear una empresa/entidad pública se informó un contacto general,
    // se registra una sola vez como contacto corporativo principal.
    // Para clientes Persona no se crea un contacto adicional: el cliente puede ser su propio contacto.
    if ((data.tipo_cliente === "Empresa" || data.tipo_cliente === "Entidad pública") && data.contacto) {
      db.prepare(`INSERT INTO cliente_contactos
        (cliente_id,nombre,cargo,tipo_contacto,telefono,celular,correo,principal,estado,observaciones,creado_por,fecha_actualizacion)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run(
          clienteId, data.contacto, "", "Otro", data.telefono, "", data.correo, 1, 1, "Contacto general creado con el cliente", req.user.id
      );
    }
    audit(req, "CREAR", `Creó cliente ${data.nombre}`, empresaId);
    res.status(201).json({ ok: true, id: clienteId });
  } catch (err) {
    res.status(409).json({ error: "No fue posible crear el cliente" });
  }
});

r.put("/:id", requireAuth, requirePermission("clientes.editar"), (req, res) => {
  const id = Number(req.params.id);
  const current = getClient(id);
  if (!current) return res.status(404).json({ error: "Cliente no encontrado" });
  if (!isAdmin(req.user) && current.empresa_id !== req.user.empresa_id) {
    return res.status(404).json({ error: "Cliente no encontrado" });
  }
  const data = normalize(req.body);
  if (!data.nombre) return res.status(400).json({ error: "Nombre del cliente obligatorio" });
  const empresaId = isAdmin(req.user) && Number(req.body?.empresa_id) ? Number(req.body.empresa_id) : current.empresa_id;
  const company = db.prepare("SELECT id FROM empresas WHERE id=? AND estado=1").get(empresaId);
  if (!company) return res.status(400).json({ error: "Empresa no válida o inactiva" });

  db.prepare(`UPDATE clientes SET empresa_id=?,codigo=?,nombre=?,nit=?,tipo_cliente=?,contacto=?,telefono=?,correo=?,direccion=?,ciudad=?,departamento=?,razon_social=?,nombre_comercial=?,digito_verificacion=?,actividad_economica=?,sitio_web=?,estado=?,observaciones=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`).run(
    empresaId,data.codigo,data.nombre,data.nit,data.tipo_cliente,data.contacto,data.telefono,data.correo,data.direccion,data.ciudad,data.departamento,data.razon_social,data.nombre_comercial,data.digito_verificacion,data.actividad_economica,data.sitio_web,data.estado,data.observaciones,id
  );
  audit(req, "EDITAR", `Editó cliente ${id} - ${data.nombre}`, empresaId);
  res.json({ ok: true });
});

r.delete("/:id", requireAuth, requirePermission("clientes.eliminar"), (req, res) => {
  const id = Number(req.params.id);
  const current = getClient(id);
  if (!current) return res.status(404).json({ error: "Cliente no encontrado" });
  if (!isAdmin(req.user) && current.empresa_id !== req.user.empresa_id) {
    return res.status(404).json({ error: "Cliente no encontrado" });
  }
  const nextState = current.estado ? 0 : 1;
  db.prepare("UPDATE clientes SET estado=?, fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(nextState, id);
  audit(req, nextState ? "ACTIVAR" : "DESACTIVAR", `${nextState ? "Activó" : "Desactivó"} cliente ${id} - ${current.nombre}`, current.empresa_id);
  res.json({ ok: true, estado: nextState });
});

// Fase 16.1 — Contactos corporativos
r.get("/:id/contactos", requireAuth, requirePermission("clientes.ver"), (req,res)=>{
  const clienteId=Number(req.params.id);
  const client=getClient(clienteId);
  if(!client || (!isAdmin(req.user) && client.empresa_id!==req.user.empresa_id)) return res.status(404).json({error:"Cliente no encontrado"});
  const contactos=db.prepare("SELECT * FROM cliente_contactos WHERE cliente_id=? ORDER BY principal DESC, nombre").all(clienteId);
  res.json({contactos});
});

r.post("/:id/contactos", requireAuth, requirePermission("clientes.editar"), (req,res)=>{
  const clienteId=Number(req.params.id);
  const client=getClient(clienteId);
  if(!client || (!isAdmin(req.user) && client.empresa_id!==req.user.empresa_id)) return res.status(404).json({error:"Cliente no encontrado"});
  const b=req.body||{};
  const nombre=String(b.nombre||"").trim();
  if(!nombre) return res.status(400).json({error:"Nombre del contacto obligatorio"});
  const principal=Number(b.principal)?1:0;
  const insert=()=>{
    const result=db.prepare(`INSERT INTO cliente_contactos(cliente_id,nombre,cargo,tipo_contacto,telefono,celular,correo,principal,estado,observaciones,creado_por,fecha_actualizacion)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run(clienteId,nombre,String(b.cargo||"").trim(),String(b.tipo_contacto||"Comercial").trim(),String(b.telefono||"").trim(),String(b.celular||"").trim(),String(b.correo||"").trim().toLowerCase(),principal,Number(b.estado??1)?1:0,String(b.observaciones||"").trim(),req.user.id);
    return Number(result.lastInsertRowid);
  };
  const tx=db.transaction(()=>{ if(principal) db.prepare("UPDATE cliente_contactos SET principal=0 WHERE cliente_id=? AND tipo_contacto=?").run(clienteId,String(b.tipo_contacto||"Comercial").trim()); return insert(); });
  const id=tx();
  audit(req,"CREAR_CONTACTO",`Creó contacto ${nombre} para cliente ${client.nombre}`,client.empresa_id);
  res.status(201).json({ok:true,id});
});

r.put("/:id/contactos/:contactoId", requireAuth, requirePermission("clientes.editar"), (req,res)=>{
  const clienteId=Number(req.params.id), contactoId=Number(req.params.contactoId);
  const client=getClient(clienteId);
  if(!client || (!isAdmin(req.user) && client.empresa_id!==req.user.empresa_id)) return res.status(404).json({error:"Cliente no encontrado"});
  const b=req.body||{}, nombre=String(b.nombre||"").trim();
  if(!nombre) return res.status(400).json({error:"Nombre del contacto obligatorio"});
  const principal=Number(b.principal)?1:0;
  const tx=db.transaction(()=>{
    if(principal) db.prepare("UPDATE cliente_contactos SET principal=0 WHERE cliente_id=? AND tipo_contacto=? AND id<>?").run(clienteId,String(b.tipo_contacto||"Comercial").trim(),contactoId);
    return db.prepare(`UPDATE cliente_contactos SET nombre=?,cargo=?,tipo_contacto=?,telefono=?,celular=?,correo=?,principal=?,estado=?,observaciones=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=? AND cliente_id=?`)
      .run(nombre,String(b.cargo||"").trim(),String(b.tipo_contacto||"Comercial").trim(),String(b.telefono||"").trim(),String(b.celular||"").trim(),String(b.correo||"").trim().toLowerCase(),principal,Number(b.estado??1)?1:0,String(b.observaciones||"").trim(),contactoId,clienteId);
  });
  const result=tx();
  if(!result.changes) return res.status(404).json({error:"Contacto no encontrado"});
  audit(req,"EDITAR_CONTACTO",`Editó contacto ${contactoId} del cliente ${client.nombre}`,client.empresa_id);
  res.json({ok:true});
});

r.delete("/:id/contactos/:contactoId", requireAuth, requirePermission("clientes.editar"), (req,res)=>{
  const clienteId=Number(req.params.id), contactoId=Number(req.params.contactoId);
  const client=getClient(clienteId);
  if(!client || (!isAdmin(req.user) && client.empresa_id!==req.user.empresa_id)) return res.status(404).json({error:"Cliente no encontrado"});
  const result=db.prepare("UPDATE cliente_contactos SET estado=0,principal=0,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=? AND cliente_id=?").run(contactoId,clienteId);
  if(!result.changes) return res.status(404).json({error:"Contacto no encontrado"});
  audit(req,"DESACTIVAR_CONTACTO",`Desactivó contacto ${contactoId} del cliente ${client.nombre}`,client.empresa_id);
  res.json({ok:true});
});

export default r;
