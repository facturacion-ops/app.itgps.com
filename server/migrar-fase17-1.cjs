const Database=require("better-sqlite3");
const db=new Database("./data/itgps.db");
try{
 db.exec(`CREATE TABLE IF NOT EXISTS ordenes_servicio(
 id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, contrato_id INTEGER, activo_id INTEGER, codigo TEXT NOT NULL DEFAULT '',
 tipo TEXT NOT NULL DEFAULT 'Instalación', prioridad TEXT NOT NULL DEFAULT 'Media', titulo TEXT NOT NULL, descripcion TEXT DEFAULT '',
 fecha_solicitud TEXT NOT NULL, fecha_programada TEXT DEFAULT '', estado TEXT NOT NULL DEFAULT 'Borrador', responsable_id INTEGER,
 observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(contrato_id) REFERENCES contratos(id),
 FOREIGN KEY(activo_id) REFERENCES activos(id), FOREIGN KEY(responsable_id) REFERENCES usuarios(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id));
 CREATE UNIQUE INDEX IF NOT EXISTS uq_ordenes_servicio_empresa_codigo ON ordenes_servicio(empresa_id,codigo) WHERE codigo<>''; CREATE INDEX IF NOT EXISTS idx_ordenes_servicio_empresa_estado ON ordenes_servicio(empresa_id,estado);
 CREATE INDEX IF NOT EXISTS idx_ordenes_servicio_cliente ON ordenes_servicio(cliente_id);`);
 console.log("Migración Fase 17.1 completada correctamente.");
}finally{db.close();}
