const Database = require("better-sqlite3");
const db = new Database("./data/itgps.db");

const columns = db.prepare("PRAGMA table_info(clientes)").all().map(c => c.name);
const migrations = [
  ["razon_social", "TEXT DEFAULT ''"],
  ["nombre_comercial", "TEXT DEFAULT ''"],
  ["digito_verificacion", "TEXT DEFAULT ''"],
  ["actividad_economica", "TEXT DEFAULT ''"],
  ["departamento", "TEXT DEFAULT ''"],
  ["sitio_web", "TEXT DEFAULT ''"]
];
for (const [name, definition] of migrations) {
  if (!columns.includes(name)) {
    db.exec(`ALTER TABLE clientes ADD COLUMN ${name} ${definition}`);
    console.log(`Agregada: ${name}`);
  }
}

db.exec(`
CREATE TABLE IF NOT EXISTS cliente_contactos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  cargo TEXT DEFAULT '',
  tipo_contacto TEXT NOT NULL DEFAULT 'Comercial',
  telefono TEXT DEFAULT '',
  celular TEXT DEFAULT '',
  correo TEXT DEFAULT '',
  principal INTEGER NOT NULL DEFAULT 0,
  estado INTEGER NOT NULL DEFAULT 1,
  observaciones TEXT DEFAULT '',
  creado_por INTEGER,
  fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY(creado_por) REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_cliente_contactos_cliente ON cliente_contactos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_contactos_estado ON cliente_contactos(cliente_id,estado);
`);

console.log("Migración Fase 16.1 completada correctamente.");
db.close();
