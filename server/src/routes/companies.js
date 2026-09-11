import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const isAdmin = (u) => u.rol === "Administrador";

function audit(req, accion, detalle) {
  db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(req.user.empresa_id, req.user.id, accion, "EMPRESAS", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent")||"");
}


function canAccessCompany(req, id) {
  return isAdmin(req.user) || Number(id) === Number(req.user.empresa_id);
}

r.get('/:id/marca', requireAuth, requirePermission('empresas.ver'), (req, res) => {
  const id = Number(req.params.id);
  if (!canAccessCompany(req, id)) return res.status(403).json({ error: 'No puede consultar la marca de otra empresa' });
  const empresa = db.prepare("SELECT id,nombre,nit,estado FROM empresas WHERE id=?").get(id);
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
  const marca = db.prepare("SELECT * FROM empresa_marca WHERE empresa_id=?").get(id) || null;
  res.json({ empresa, marca });
});

r.put('/:id/marca', requireAuth, requirePermission('empresas.editar'), (req, res) => {
  const id = Number(req.params.id);
  if (!canAccessCompany(req, id)) return res.status(403).json({ error: 'No puede modificar la marca de otra empresa' });
  const empresa = db.prepare("SELECT id FROM empresas WHERE id=?").get(id);
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
  const body = req.body || {};
  const text = (v, max=5000) => String(v ?? '').trim().slice(0, max);
  const data = {
    nombre_aplicacion: text(body.nombre_aplicacion, 120),
    nombre_comercial: text(body.nombre_comercial, 180),
    logo_principal: text(body.logo_principal, 2000000),
    logo_secundario: text(body.logo_secundario, 2000000),
    favicon: text(body.favicon, 200000),
    color_principal: text(body.color_principal, 20) || '#0A1E2E',
    color_secundario: text(body.color_secundario, 20) || '#F5F8FA',
    color_acento: text(body.color_acento, 20) || '#8CF63C',
    encabezado: text(body.encabezado, 2000),
    pie_pagina: text(body.pie_pagina, 2000),
    texto_legal: text(body.texto_legal, 5000),
    terminos_condiciones: text(body.terminos_condiciones, 10000),
    firma_nombre: text(body.firma_nombre, 180),
    firma_cargo: text(body.firma_cargo, 180),
    datos_bancarios: text(body.datos_bancarios, 3000),
    moneda: text(body.moneda, 10) || 'COP',
    formato_fecha: text(body.formato_fecha, 40) || 'DD/MM/YYYY',
    formato_numerico: text(body.formato_numerico, 40) || 'es-CO',
    zona_horaria: text(body.zona_horaria, 80) || 'America/Bogota'
  };
  if (!/^#[0-9A-Fa-f]{6}$/.test(data.color_principal) || !/^#[0-9A-Fa-f]{6}$/.test(data.color_secundario) || !/^#[0-9A-Fa-f]{6}$/.test(data.color_acento)) {
    return res.status(400).json({ error: 'Los colores deben estar en formato hexadecimal #RRGGBB' });
  }
  db.prepare(`INSERT INTO empresa_marca(empresa_id,nombre_aplicacion,nombre_comercial,logo_principal,logo_secundario,favicon,color_principal,color_secundario,color_acento,encabezado,pie_pagina,texto_legal,terminos_condiciones,firma_nombre,firma_cargo,datos_bancarios,moneda,formato_fecha,formato_numerico,zona_horaria)
    VALUES(@empresa_id,@nombre_aplicacion,@nombre_comercial,@logo_principal,@logo_secundario,@favicon,@color_principal,@color_secundario,@color_acento,@encabezado,@pie_pagina,@texto_legal,@terminos_condiciones,@firma_nombre,@firma_cargo,@datos_bancarios,@moneda,@formato_fecha,@formato_numerico,@zona_horaria)
    ON CONFLICT(empresa_id) DO UPDATE SET nombre_aplicacion=excluded.nombre_aplicacion,nombre_comercial=excluded.nombre_comercial,logo_principal=excluded.logo_principal,logo_secundario=excluded.logo_secundario,favicon=excluded.favicon,color_principal=excluded.color_principal,color_secundario=excluded.color_secundario,color_acento=excluded.color_acento,encabezado=excluded.encabezado,pie_pagina=excluded.pie_pagina,texto_legal=excluded.texto_legal,terminos_condiciones=excluded.terminos_condiciones,firma_nombre=excluded.firma_nombre,firma_cargo=excluded.firma_cargo,datos_bancarios=excluded.datos_bancarios,moneda=excluded.moneda,formato_fecha=excluded.formato_fecha,formato_numerico=excluded.formato_numerico,zona_horaria=excluded.zona_horaria,fecha_actualizacion=CURRENT_TIMESTAMP`).run({empresa_id:id,...data});
  audit(req, 'EDITAR', `Actualizó marca blanca de empresa ${id}`);
  res.json({ ok:true, marca: db.prepare("SELECT * FROM empresa_marca WHERE empresa_id=?").get(id) });
});

r.get("/mi-empresa", requireAuth, (req, res) => {
  const empresa = db.prepare("SELECT id,nombre,nit,estado,fecha_creacion FROM empresas WHERE id=?").get(req.user.empresa_id);
  res.json({ empresa });
});

r.get("/catalogo", requireAuth, requirePermission("activos.ver"), (req, res) => {
  // Catálogo seguro para formularios de Activos: el Administrador puede
  // seleccionar cualquier empresa activa; los demás usuarios solo su empresa.
  if (isAdmin(req.user)) {
    const empresas = db.prepare("SELECT id,nombre,nit,estado FROM empresas WHERE estado=1 ORDER BY nombre").all();
    return res.json({ empresas });
  }
  const empresa = db.prepare("SELECT id,nombre,nit,estado FROM empresas WHERE id=? AND estado=1").get(req.user.empresa_id);
  res.json({ empresas: empresa ? [empresa] : [] });
});

r.get("/", requireAuth, requirePermission("empresas.ver"), (req, res) => {
  const empresas = db.prepare("SELECT id,nombre,nit,estado,fecha_creacion FROM empresas ORDER BY nombre").all();
  res.json({ empresas });
});

r.post("/", requireAuth, requirePermission("empresas.crear"), (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: "Solo Administrador puede crear empresas" });
  const { nombre, nit = "" } = req.body || {};
  if (!nombre?.trim()) return res.status(400).json({ error: "Nombre obligatorio" });
  try {
    const result = db.prepare("INSERT INTO empresas(nombre,nit) VALUES(?,?)").run(nombre.trim(), nit.trim() || null);
    audit(req, "CREAR", `Creó empresa ${nombre.trim()}`);
    res.status(201).json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch {
    res.status(409).json({ error: "No fue posible crear la empresa" });
  }
});

r.put("/:id", requireAuth, requirePermission("empresas.editar"), (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: "Solo Administrador puede modificar empresas" });
  const id = Number(req.params.id);
  const { nombre, nit = "", estado = 1 } = req.body || {};
  if (!nombre?.trim()) return res.status(400).json({ error: "Nombre obligatorio" });
  const empresa = db.prepare("SELECT id FROM empresas WHERE id=?").get(id);
  if (!empresa) return res.status(404).json({ error: "Empresa no encontrada" });
  if (id === req.user.empresa_id && !Number(estado)) return res.status(400).json({ error: "No puede desactivar su empresa actual" });
  db.prepare("UPDATE empresas SET nombre=?,nit=?,estado=? WHERE id=?").run(nombre.trim(), nit.trim() || null, Number(estado) ? 1 : 0, id);
  audit(req, "EDITAR", `Editó empresa ${id}`);
  res.json({ ok: true });
});

export default r;
