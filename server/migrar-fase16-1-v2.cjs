const Database = require("better-sqlite3");
const db = new Database("./data/itgps.db");

// Normaliza contactos principales: solo uno activo por tipo y cliente.
const duplicates = db.prepare(`
  SELECT cliente_id,tipo_contacto,COUNT(*) total
  FROM cliente_contactos
  WHERE estado=1 AND principal=1
  GROUP BY cliente_id,tipo_contacto
  HAVING COUNT(*)>1
`).all();

const tx = db.transaction(() => {
  for (const d of duplicates) {
    const rows = db.prepare(`SELECT id FROM cliente_contactos WHERE cliente_id=? AND tipo_contacto=? AND estado=1 AND principal=1 ORDER BY id`).all(d.cliente_id,d.tipo_contacto);
    rows.slice(1).forEach(r => db.prepare("UPDATE cliente_contactos SET principal=0,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(r.id));
  }
});
tx();

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS ux_cliente_contacto_principal_tipo
ON cliente_contactos(cliente_id,tipo_contacto)
WHERE principal=1 AND estado=1;
CREATE INDEX IF NOT EXISTS idx_activos_cliente_estado ON activos(cliente_id,estado);
CREATE INDEX IF NOT EXISTS idx_equipos_activo_estado ON equipos(activo_id,estado);
CREATE INDEX IF NOT EXISTS idx_sim_equipo_estado ON sim_cards(equipo_id,estado);
`);

console.log("Migración Fase 16.1 V2 completada correctamente.");
db.close();
