const Database = require("better-sqlite3");
const path = require("node:path");
const db = new Database(path.join(__dirname, "data", "itgps.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS planes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL,
  servicio_id INTEGER NOT NULL,
  codigo TEXT NOT NULL DEFAULT '',
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  modalidad TEXT NOT NULL DEFAULT 'Recurrente',
  periodicidad TEXT NOT NULL DEFAULT 'Mensual',
  precio REAL NOT NULL DEFAULT 0,
  costo_instalacion REAL NOT NULL DEFAULT 0,
  duracion_meses INTEGER NOT NULL DEFAULT 0,
  estado INTEGER NOT NULL DEFAULT 1,
  observaciones TEXT DEFAULT '',
  creado_por INTEGER,
  fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(empresa_id) REFERENCES empresas(id),
  FOREIGN KEY(servicio_id) REFERENCES servicios(id),
  FOREIGN KEY(creado_por) REFERENCES usuarios(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_planes_empresa_codigo ON planes(empresa_id,codigo) WHERE codigo <> '';
CREATE INDEX IF NOT EXISTS idx_planes_empresa_estado ON planes(empresa_id,estado);
CREATE INDEX IF NOT EXISTS idx_planes_servicio ON planes(servicio_id);
`);
console.log("Migración Fase 16.3 completada correctamente.");
db.close();
