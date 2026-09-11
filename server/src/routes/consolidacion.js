import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const isAdmin = (u) => u.rol === "Administrador";

function companyFilter(req, requested = 0) {
  return isAdmin(req.user) && Number(requested) ? Number(requested) : req.user.empresa_id;
}

r.get("/resumen", requireAuth, requirePermission("consolidacion.ver"), (req, res) => {
  const empresaId = companyFilter(req, req.query.empresa_id);
  const params = [empresaId];
  const summary = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM clientes WHERE empresa_id=? AND estado=1) clientes,
      (SELECT COUNT(*) FROM activos WHERE empresa_id=? AND estado<>'Retirado') activos,
      (SELECT COUNT(*) FROM equipos WHERE empresa_id=? AND estado<>'Retirado') equipos,
      (SELECT COUNT(*) FROM sim_cards WHERE empresa_id=? AND estado<>'Baja') sims,
      (SELECT COUNT(*) FROM activos a WHERE a.empresa_id=? AND a.estado<>'Retirado' AND NOT EXISTS (SELECT 1 FROM equipos e WHERE e.activo_id=a.id AND e.estado<>'Retirado')) activos_sin_gps,
      (SELECT COUNT(*) FROM equipos e WHERE e.empresa_id=? AND e.estado<>'Retirado' AND e.activo_id IS NULL) gps_sin_activo,
      (SELECT COUNT(*) FROM sim_cards s WHERE s.empresa_id=? AND s.estado<>'Baja' AND s.equipo_id IS NULL) sims_sin_gps,
      (SELECT COUNT(*) FROM equipos e JOIN activos a ON a.id=e.activo_id WHERE e.empresa_id=? AND e.estado<>'Retirado' AND a.empresa_id<>e.empresa_id) gps_empresa_inconsistente,
      (SELECT COUNT(*) FROM sim_cards s JOIN equipos e ON e.id=s.equipo_id WHERE s.empresa_id=? AND s.estado<>'Baja' AND e.empresa_id<>s.empresa_id) sim_empresa_inconsistente
  `).get(empresaId, empresaId, empresaId, empresaId, empresaId, empresaId, empresaId, empresaId, empresaId);
  res.json({ resumen: summary });
});


function audit(req, accion, detalle, empresaId) {
  db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(empresaId, req.user.id, accion, "CONSOLIDACION", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent") || "");
}

function validCompany(req, empresaId) {
  return isAdmin(req.user)
    ? db.prepare("SELECT id,nombre FROM empresas WHERE id=? AND estado=1").get(empresaId)
    : db.prepare("SELECT id,nombre FROM empresas WHERE id=? AND estado=1").get(req.user.empresa_id);
}

r.get("/catalogos", requireAuth, requirePermission("consolidacion.editar"), (req, res) => {
  const empresaId = companyFilter(req, req.query.empresa_id);
  if (!validCompany(req, empresaId)) return res.status(400).json({error:"Empresa no válida o inactiva"});
  // Solo ofrecemos destinos disponibles para evitar reasignaciones accidentales.
  // Un activo ocupado por otro GPS no aparece en "Equipo -> Activo".
  // Un GPS ocupado por otra SIM no aparece en "SIM -> Equipo".
  const activos = db.prepare(`SELECT a.id,a.codigo,a.placa,c.nombre cliente
    FROM activos a
    LEFT JOIN clientes c ON c.id=a.cliente_id
    WHERE a.empresa_id=? AND a.estado<>'Retirado'
      AND NOT EXISTS (
        SELECT 1 FROM equipos e
        WHERE e.activo_id=a.id AND e.estado<>'Retirado'
      )
    ORDER BY COALESCE(NULLIF(a.placa,''),a.codigo)`).all(empresaId);
  const equipos = db.prepare(`SELECT e.id,e.codigo,e.imei,e.marca,e.modelo,a.id activo_id,a.codigo activo_codigo
    FROM equipos e
    LEFT JOIN activos a ON a.id=e.activo_id
    WHERE e.empresa_id=? AND e.estado<>'Retirado'
      AND NOT EXISTS (
        SELECT 1 FROM sim_cards s
        WHERE s.equipo_id=e.id AND s.estado<>'Baja'
      )
    ORDER BY COALESCE(NULLIF(e.codigo,''),e.imei)`).all(empresaId);
  const sims = db.prepare(`SELECT s.id,s.iccid,s.numero,g.id equipo_id,g.codigo equipo_codigo
    FROM sim_cards s LEFT JOIN equipos g ON g.id=s.equipo_id
    WHERE s.empresa_id=? AND s.estado<>'Baja'
    ORDER BY s.iccid`).all(empresaId);
  res.json({activos,equipos,sims});
});

r.patch("/relacion/equipo-activo", requireAuth, requirePermission("consolidacion.editar"), (req,res) => {
  const equipoId=Number(req.body?.equipo_id), activoId=Number(req.body?.activo_id)||null;
  const equipo=db.prepare("SELECT * FROM equipos WHERE id=?").get(equipoId);
  if(!equipo) return res.status(404).json({error:"Equipo GPS no encontrado"});
  if(!isAdmin(req.user)&&equipo.empresa_id!==req.user.empresa_id) return res.status(403).json({error:"Equipo fuera de la empresa del usuario"});
  const activo=activoId?db.prepare("SELECT * FROM activos WHERE id=? AND empresa_id=? AND estado<>'Retirado'").get(activoId,equipo.empresa_id):null;
  if(activoId&&!activo) return res.status(400).json({error:"Activo no válido para la empresa del equipo"});
  if(activoId){ const ocupado=db.prepare("SELECT id FROM equipos WHERE activo_id=? AND id<>? AND estado<>'Retirado' LIMIT 1").get(activoId,equipoId); if(ocupado) return res.status(409).json({error:"El activo ya tiene otro equipo GPS asignado"}); }
  db.prepare("UPDATE equipos SET activo_id=? WHERE id=?").run(activoId,equipoId);
  audit(req, activoId?"ASIGNAR_GPS_ACTIVO":"DESASIGNAR_GPS_ACTIVO", `Equipo ${equipo.imei||equipo.codigo} ${activoId?`asignado al activo ${activo.codigo||activo.placa}`:"desasociado del activo"}`, equipo.empresa_id);
  res.json({ok:true});
});

r.patch("/relacion/sim-equipo", requireAuth, requirePermission("consolidacion.editar"), (req,res) => {
  const simId=Number(req.body?.sim_id), equipoId=Number(req.body?.equipo_id)||null;
  const sim=db.prepare("SELECT * FROM sim_cards WHERE id=?").get(simId);
  if(!sim) return res.status(404).json({error:"SIM no encontrada"});
  if(!isAdmin(req.user)&&sim.empresa_id!==req.user.empresa_id) return res.status(403).json({error:"SIM fuera de la empresa del usuario"});
  const equipo=equipoId?db.prepare("SELECT * FROM equipos WHERE id=? AND empresa_id=? AND estado<>'Retirado'").get(equipoId,sim.empresa_id):null;
  if(equipoId&&!equipo) return res.status(400).json({error:"Equipo GPS no válido para la empresa de la SIM"});
  if(equipoId){ const ocupado=db.prepare("SELECT id FROM sim_cards WHERE equipo_id=? AND id<>? AND estado<>'Baja' LIMIT 1").get(equipoId,simId); if(ocupado) return res.status(409).json({error:"El equipo GPS ya tiene otra SIM asignada"}); }
  db.prepare("UPDATE sim_cards SET equipo_id=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(equipoId,simId);
  audit(req, equipoId?"ASIGNAR_SIM_GPS":"DESASIGNAR_SIM_GPS", `SIM ${sim.iccid} ${equipoId?`asignada al equipo ${equipo.imei||equipo.codigo}`:"desasociada del equipo"}`, sim.empresa_id);
  res.json({ok:true});
});

// Desvinculación explícita: libera el recurso para poder reutilizarlo en otra relación.
r.patch("/desvincular", requireAuth, requirePermission("consolidacion.editar"), (req,res) => {
  const tipo=String(req.body?.tipo||"");
  const id=Number(req.body?.id);
  if(!id || !["equipo-activo","sim-equipo"].includes(tipo))
    return res.status(400).json({error:"Tipo o registro no válido para desvincular"});

  if(tipo==="equipo-activo"){
    const equipo=db.prepare("SELECT * FROM equipos WHERE id=?").get(id);
    if(!equipo) return res.status(404).json({error:"Equipo GPS no encontrado"});
    if(!isAdmin(req.user)&&equipo.empresa_id!==req.user.empresa_id)
      return res.status(403).json({error:"Equipo fuera de la empresa del usuario"});
    db.prepare("UPDATE equipos SET activo_id=NULL WHERE id=?").run(id);
    audit(req,"DESVINCULAR_GPS_ACTIVO",`Equipo ${equipo.imei||equipo.codigo} liberado del activo`,equipo.empresa_id);
    return res.json({ok:true});
  }

  const sim=db.prepare("SELECT * FROM sim_cards WHERE id=?").get(id);
  if(!sim) return res.status(404).json({error:"SIM no encontrada"});
  if(!isAdmin(req.user)&&sim.empresa_id!==req.user.empresa_id)
    return res.status(403).json({error:"SIM fuera de la empresa del usuario"});
  db.prepare("UPDATE sim_cards SET equipo_id=NULL,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(id);
  audit(req,"DESVINCULAR_SIM_GPS",`SIM ${sim.iccid} liberada del equipo GPS`,sim.empresa_id);
  return res.json({ok:true});
});

r.get("/", requireAuth, requirePermission("consolidacion.ver"), (req, res) => {
  const empresaId = companyFilter(req, req.query.empresa_id);
  const q = String(req.query.q || "").trim();
  const estado = String(req.query.estado || "").trim();
  const params = [empresaId];
  let sql = `
    SELECT a.id activo_id, a.codigo activo_codigo, a.placa, a.tipo_activo, a.estado activo_estado,
           c.id cliente_id, c.nombre cliente,
           e.id equipo_id, e.imei, e.codigo equipo_codigo, e.marca, e.modelo, e.estado equipo_estado,
           s.id sim_id, s.iccid, s.numero, s.operador, s.estado sim_estado,
           CASE
             WHEN e.id IS NULL THEN 'ACTIVO_SIN_GPS'
             WHEN s.id IS NULL THEN 'GPS_SIN_SIM'
             ELSE 'OPERATIVO'
           END estado_relacion
    FROM activos a
    JOIN clientes c ON c.id=a.cliente_id
    LEFT JOIN equipos e ON e.activo_id=a.id AND e.estado<>'Retirado'
    LEFT JOIN sim_cards s ON s.equipo_id=e.id AND s.estado<>'Baja'
    WHERE a.empresa_id=? AND a.estado<>'Retirado'
  `;
  if (q) {
    sql += ` AND (a.codigo LIKE ? OR a.placa LIKE ? OR c.nombre LIKE ? OR e.imei LIKE ? OR e.codigo LIKE ? OR e.marca LIKE ? OR e.modelo LIKE ? OR s.iccid LIKE ? OR s.numero LIKE ?)`;
    const like = `%${q}%`;
    for (let i = 0; i < 9; i++) params.push(like);
  }
  if (estado) { sql += " AND (CASE WHEN e.id IS NULL THEN 'ACTIVO_SIN_GPS' WHEN s.id IS NULL THEN 'GPS_SIN_SIM' ELSE 'OPERATIVO' END)=?"; params.push(estado); }
  sql += " ORDER BY c.nombre, a.placa, a.codigo LIMIT 2000";
  const rows = db.prepare(sql).all(...params);

  const orphanGps = db.prepare(`
    SELECT e.id equipo_id, e.codigo equipo_codigo, e.imei, e.marca, e.modelo, e.estado equipo_estado,
           NULL activo_id, NULL activo_codigo, NULL placa, NULL cliente,
           NULL sim_id, NULL iccid, NULL numero, NULL operador, NULL sim_estado,
           'GPS_SIN_ACTIVO' estado_relacion
    FROM equipos e
    WHERE e.empresa_id=? AND e.estado<>'Retirado' AND e.activo_id IS NULL
    ORDER BY e.codigo, e.imei LIMIT 2000
  `).all(empresaId);

  const orphanSims = db.prepare(`
    SELECT NULL activo_id, NULL activo_codigo, NULL placa, NULL tipo_activo, NULL activo_estado,
           NULL cliente_id, NULL cliente,
           e.id equipo_id, e.imei, e.codigo equipo_codigo, e.marca, e.modelo, e.estado equipo_estado,
           s.id sim_id, s.iccid, s.numero, s.operador, s.estado sim_estado,
           'SIM_SIN_GPS' estado_relacion
    FROM sim_cards s
    LEFT JOIN equipos e ON e.id=s.equipo_id
    WHERE s.empresa_id=? AND s.estado<>'Baja' AND s.equipo_id IS NULL
    ORDER BY s.iccid LIMIT 2000
  `).all(empresaId);

  const combined = [...rows, ...orphanGps, ...orphanSims];
  res.json({ rows: combined });
});

r.get("/inconsistencias", requireAuth, requirePermission("consolidacion.ver"), (req, res) => {
  const empresaId = companyFilter(req, req.query.empresa_id);
  const issues = [];
  const push = (tipo, entidad, entidadId, detalle) => issues.push({ tipo, entidad, entidad_id: entidadId, detalle });

  db.prepare(`SELECT e.id,e.imei,e.activo_id,e.empresa_id,a.empresa_id activo_empresa FROM equipos e JOIN activos a ON a.id=e.activo_id WHERE e.empresa_id=? AND e.empresa_id<>a.empresa_id`).all(empresaId)
    .forEach(x => push("EMPRESA_INCONSISTENTE", "EQUIPO", x.id, `El equipo ${x.imei} pertenece a una empresa diferente al activo asociado.`));

  db.prepare(`SELECT s.id,s.iccid,s.equipo_id,s.empresa_id,e.empresa_id equipo_empresa FROM sim_cards s JOIN equipos e ON e.id=s.equipo_id WHERE s.empresa_id=? AND s.empresa_id<>e.empresa_id`).all(empresaId)
    .forEach(x => push("EMPRESA_INCONSISTENTE", "SIM", x.id, `La SIM ${x.iccid} pertenece a una empresa diferente al equipo asociado.`));

  db.prepare(`SELECT a.id,a.codigo,a.placa FROM activos a LEFT JOIN clientes c ON c.id=a.cliente_id WHERE a.empresa_id=? AND a.estado<>'Retirado' AND c.id IS NULL`).all(empresaId)
    .forEach(x => push("ACTIVO_SIN_CLIENTE", "ACTIVO", x.id, `El activo ${x.codigo || x.placa || x.id} no tiene un cliente válido.`));

  db.prepare(`SELECT e.id,e.imei FROM equipos e WHERE e.empresa_id=? AND e.estado<>'Retirado' AND e.activo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM activos a WHERE a.id=e.activo_id)`).all(empresaId)
    .forEach(x => push("GPS_ACTIVO_INEXISTENTE", "EQUIPO", x.id, `El equipo ${x.imei} apunta a un activo que no existe.`));

  db.prepare(`SELECT s.id,s.iccid FROM sim_cards s WHERE s.empresa_id=? AND s.estado<>'Baja' AND s.equipo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM equipos e WHERE e.id=s.equipo_id)`).all(empresaId)
    .forEach(x => push("SIM_GPS_INEXISTENTE", "SIM", x.id, `La SIM ${x.iccid} apunta a un equipo que no existe.`));

  res.json({ issues });
});

export default r;
