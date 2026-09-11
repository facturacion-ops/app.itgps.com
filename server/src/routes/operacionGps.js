import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const isAdmin = u => u.rol === "Administrador";

function companyFilter(req, requested = 0) {
  const id = isAdmin(req.user) && Number(requested) ? Number(requested) : req.user.empresa_id;
  return id;
}

function audit(req, accion, detalle, empresaId) {
  db.prepare(`INSERT INTO auditoria
    (empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(empresaId, req.user.id, accion, "OPERACION_GPS", detalle, req.ip, "OK",
      req.method, req.originalUrl, req.get("user-agent") || "");
}

r.get("/catalogos", requireAuth, requirePermission("operacion_gps.ver"), (req,res) => {
  const empresaId = companyFilter(req, req.query.empresa_id);
  if (!empresaId) return res.json({ empresas: db.prepare("SELECT id,nombre,nit FROM empresas WHERE estado=1 ORDER BY nombre").all() });
  const empresas = isAdmin(req.user)
    ? db.prepare("SELECT id,nombre,nit FROM empresas WHERE estado=1 ORDER BY nombre").all()
    : db.prepare("SELECT id,nombre,nit FROM empresas WHERE id=? AND estado=1").all(empresaId);
  res.json({ empresas });
});

r.get("/", requireAuth, requirePermission("operacion_gps.ver"), (req,res) => {
  const empresaId = companyFilter(req, req.query.empresa_id);
  const q = String(req.query.q || "").trim();
  const conectividad = String(req.query.conectividad || "").trim();
  const operacional = String(req.query.operacional || "").trim();
  const relacion = String(req.query.relacion || "").trim();
  const params = [empresaId];
  let where = "e.empresa_id=?";
  if (q) {
    where += ` AND (e.imei LIKE ? OR e.codigo LIKE ? OR e.marca LIKE ? OR e.modelo LIKE ?
      OR a.codigo LIKE ? OR a.placa LIKE ? OR c.nombre LIKE ?)`;
    const l = `%${q}%`; for (let i=0;i<7;i++) params.push(l);
  }
  if (conectividad) { where += " AND e.estado_conectividad=?"; params.push(conectividad); }
  if (operacional) { where += " AND e.estado_operacional=?"; params.push(operacional); }
  if (relacion === "SIN_ACTIVO") where += " AND e.activo_id IS NULL";
  if (relacion === "CON_ACTIVO") where += " AND e.activo_id IS NOT NULL";
  if (relacion === "SIN_SIM") where += " AND NOT EXISTS (SELECT 1 FROM sim_cards sx WHERE sx.equipo_id=e.id)";
  if (relacion === "CON_SIM") where += " AND EXISTS (SELECT 1 FROM sim_cards sx WHERE sx.equipo_id=e.id)";

  const rows = db.prepare(`SELECT e.id,e.empresa_id,e.imei,e.codigo,e.marca,e.modelo,e.tipo_dispositivo,e.estado,
    e.estado_operacional,e.estado_conectividad,e.ultima_comunicacion,e.ultima_latitud,e.ultima_longitud,
    e.observaciones_operacion,e.fecha_actualizacion_operacion,
    emp.nombre empresa,a.id activo_id,a.codigo activo_codigo,a.placa,c.id cliente_id,c.nombre cliente,
    s.id sim_id,s.iccid
    FROM equipos e
    JOIN empresas emp ON emp.id=e.empresa_id
    LEFT JOIN activos a ON a.id=e.activo_id
    LEFT JOIN clientes c ON c.id=a.cliente_id
    LEFT JOIN sim_cards s ON s.equipo_id=e.id
    WHERE ${where}
    ORDER BY CASE e.estado_conectividad WHEN 'Online' THEN 0 WHEN 'Offline' THEN 1 ELSE 2 END, e.imei
    LIMIT 2000`).all(...params);

  const summary = {
    total: rows.length,
    online: rows.filter(x=>x.estado_conectividad==="Online").length,
    offline: rows.filter(x=>x.estado_conectividad==="Offline").length,
    sin_comunicacion: rows.filter(x=>x.estado_conectividad==="Sin comunicación").length,
    con_activo: rows.filter(x=>x.activo_id).length,
    con_sim: rows.filter(x=>x.sim_id).length,
    mantenimiento: rows.filter(x=>x.estado_operacional==="En mantenimiento").length,
    fuera_servicio: rows.filter(x=>x.estado_operacional==="Fuera de servicio").length
  };
  res.json({ summary, rows });
});

r.put("/:id", requireAuth, requirePermission("operacion_gps.editar"), (req,res) => {
  const id = Number(req.params.id);
  const current = db.prepare("SELECT * FROM equipos WHERE id=?").get(id);
  if (!current || (!isAdmin(req.user) && current.empresa_id !== req.user.empresa_id))
    return res.status(404).json({error:"Equipo GPS no encontrado"});

  const estadosConectividad = ["Online","Offline","Sin comunicación"];
  const estadosOperacionales = ["Operativo","En instalación","En mantenimiento","Fuera de servicio"];
  const conectividad = estadosConectividad.includes(String(req.body.estado_conectividad||""))
    ? String(req.body.estado_conectividad) : current.estado_conectividad;
  const operacional = estadosOperacionales.includes(String(req.body.estado_operacional||""))
    ? String(req.body.estado_operacional) : current.estado_operacional;
  const lat = req.body.ultima_latitud === "" || req.body.ultima_latitud == null ? null : Number(req.body.ultima_latitud);
  const lon = req.body.ultima_longitud === "" || req.body.ultima_longitud == null ? null : Number(req.body.ultima_longitud);
  if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90))
    return res.status(400).json({error:"Latitud inválida"});
  if (lon !== null && (!Number.isFinite(lon) || lon < -180 || lon > 180))
    return res.status(400).json({error:"Longitud inválida"});

  const now = new Date().toISOString();
  db.prepare(`UPDATE equipos SET estado_operacional=?,estado_conectividad=?,ultima_comunicacion=?,
    ultima_latitud=?,ultima_longitud=?,observaciones_operacion=?,fecha_actualizacion_operacion=? WHERE id=?`)
    .run(operacional, conectividad, String(req.body.ultima_comunicacion||current.ultima_comunicacion||""),
      lat, lon, String(req.body.observaciones_operacion||""), now, id);

  audit(req, "ACTUALIZAR_ESTADO_OPERACIONAL",
    `Equipo GPS ${current.imei}: ${current.estado_operacional} → ${operacional}; ${current.estado_conectividad} → ${conectividad}`, current.empresa_id);

  const updated = db.prepare(`SELECT e.*,emp.nombre empresa,a.codigo activo_codigo,a.placa,c.nombre cliente,s.iccid
    FROM equipos e JOIN empresas emp ON emp.id=e.empresa_id
    LEFT JOIN activos a ON a.id=e.activo_id LEFT JOIN clientes c ON c.id=a.cliente_id
    LEFT JOIN sim_cards s ON s.equipo_id=e.id WHERE e.id=?`).get(id);
  res.json({ equipo: updated });
});

export default r;
