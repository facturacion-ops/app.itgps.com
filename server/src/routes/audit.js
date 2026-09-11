import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();

// SQLite CURRENT_TIMESTAMP se conserva en UTC. La aplicación muestra/exporta
// la hora oficial de Colombia (America/Bogota, UTC-5) para evitar desfases.
function formatColombiaDate(value) {
  if (!value) return "";
  const raw = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)
    ? new Date(raw.replace(" ", "T") + "Z")
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(date);
}
const isAdmin = (u) => u.rol === "Administrador";

function buildWhere(req) {
  const params = [];
  const where = ["1=1"];
  const q = String(req.query.q || "").trim();
  const empresaId = Number(req.query.empresa_id || 0);
  const usuarioId = Number(req.query.usuario_id || 0);
  const modulo = String(req.query.modulo || "").trim();
  const accion = String(req.query.accion || "").trim();
  const desde = String(req.query.fecha_desde || "").trim();
  const hasta = String(req.query.fecha_hasta || "").trim();

  if (!isAdmin(req.user)) {
    where.push("a.empresa_id=?");
    params.push(req.user.empresa_id);
  } else if (empresaId) {
    where.push("a.empresa_id=?");
    params.push(empresaId);
  }
  if (usuarioId) { where.push("a.usuario_id=?"); params.push(usuarioId); }
  if (modulo) { where.push("a.modulo=?"); params.push(modulo); }
  if (accion) { where.push("a.accion=?"); params.push(accion); }
  if (desde) { where.push("date(a.fecha)>=date(?)"); params.push(desde); }
  if (hasta) { where.push("date(a.fecha)<=date(?)"); params.push(hasta); }
  if (q) {
    const like = `%${q}%`;
    where.push(`(a.detalle LIKE ? OR a.accion LIKE ? OR a.modulo LIKE ? OR a.ip LIKE ? OR
                e.nombre LIKE ? OR u.nombre LIKE ? OR u.apellido LIKE ? OR u.correo LIKE ? OR
                a.entidad LIKE ? OR CAST(a.entidad_id AS TEXT) LIKE ?)`);
    params.push(like, like, like, like, like, like, like, like, like, like);
  }
  return { where: where.join(" AND "), params };
}

function baseSelect() {
  return `SELECT a.id,a.empresa_id,e.nombre empresa,a.usuario_id,
    COALESCE(NULLIF(TRIM(u.nombre || ' ' || COALESCE(u.apellido,'')),''), 'Sistema') usuario,
    u.correo usuario_correo,a.accion,a.modulo,a.detalle,a.ip,a.fecha,a.resultado,
    a.metodo,a.ruta,a.user_agent,a.entidad,a.entidad_id,a.datos_antes,a.datos_despues
    FROM auditoria a
    LEFT JOIN empresas e ON e.id=a.empresa_id
    LEFT JOIN usuarios u ON u.id=a.usuario_id`;
}

r.get("/filtros", requireAuth, requirePermission("auditoria.ver"), (req, res) => {
  const empresas = isAdmin(req.user)
    ? db.prepare("SELECT id,nombre,nit FROM empresas ORDER BY nombre").all()
    : db.prepare("SELECT id,nombre,nit FROM empresas WHERE id=?").all(req.user.empresa_id);
  const usuarios = isAdmin(req.user)
    ? db.prepare("SELECT id,nombre,apellido,correo FROM usuarios ORDER BY nombre,apellido").all()
    : db.prepare("SELECT id,nombre,apellido,correo FROM usuarios WHERE empresa_id=? ORDER BY nombre,apellido").all(req.user.empresa_id);
  const modulos = db.prepare("SELECT DISTINCT modulo FROM auditoria WHERE modulo IS NOT NULL AND modulo<>'' ORDER BY modulo").all().map(x => x.modulo);
  const acciones = db.prepare("SELECT DISTINCT accion FROM auditoria WHERE accion IS NOT NULL AND accion<>'' ORDER BY accion").all().map(x => x.accion);
  res.json({ empresas, usuarios, modulos, acciones });
});

r.get("/resumen", requireAuth, requirePermission("auditoria.ver"), (req, res) => {
  const { where, params } = buildWhere(req);
  const row = db.prepare(`SELECT COUNT(*) total,
    SUM(CASE WHEN a.accion='LOGIN' THEN 1 ELSE 0 END) logins,
    SUM(CASE WHEN a.accion IN ('CREAR','EDITAR','ELIMINAR','ACTIVAR','DESACTIVAR','ASIGNAR','DESASIGNAR','PERMISOS') THEN 1 ELSE 0 END) cambios,
    SUM(CASE WHEN a.accion='EXPORTAR' THEN 1 ELSE 0 END) exportaciones,
    COUNT(DISTINCT a.usuario_id) usuarios
    FROM auditoria a LEFT JOIN empresas e ON e.id=a.empresa_id LEFT JOIN usuarios u ON u.id=a.usuario_id WHERE ${where}`).get(...params);
  res.json({ resumen: row });
});

r.get("/", requireAuth, requirePermission("auditoria.ver"), (req, res) => {
  const { where, params } = buildWhere(req);
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(10, Number(req.query.limit || 25)));
  const total = db.prepare(`SELECT COUNT(*) total FROM auditoria a LEFT JOIN empresas e ON e.id=a.empresa_id LEFT JOIN usuarios u ON u.id=a.usuario_id WHERE ${where}`).get(...params).total;
  const offset = (page - 1) * limit;
  const registros = db.prepare(`${baseSelect()} WHERE ${where} ORDER BY a.id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json({ registros, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
});

r.get("/export", requireAuth, requirePermission("auditoria.exportar"), (req, res) => {
  const { where, params } = buildWhere(req);
  const rows = db.prepare(`${baseSelect()} WHERE ${where} ORDER BY a.id DESC LIMIT 10000`).all(...params);
  const headers = ["Fecha","Empresa","Usuario","Correo","Acción","Módulo","Entidad","ID entidad","Resultado","Detalle","IP","Método","Ruta","Datos antes","Datos después"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map(x => [formatColombiaDate(x.fecha),x.empresa,x.usuario,x.usuario_correo,x.accion,x.modulo,x.entidad,x.entidad_id,x.resultado,x.detalle,x.ip,x.metodo,x.ruta,x.datos_antes,x.datos_despues].map(esc).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="itgps-auditoria-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send("\ufeff" + csv);
});

export default r;
