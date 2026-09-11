const Database=require('better-sqlite3');
const db=new Database('./data/itgps.db');
try{
 db.exec(`CREATE TABLE IF NOT EXISTS contratos(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, cotizacion_id INTEGER, suscripcion_id INTEGER,
 codigo TEXT NOT NULL DEFAULT '', titulo TEXT NOT NULL DEFAULT '', fecha_inicio TEXT NOT NULL, fecha_fin TEXT DEFAULT '',
 estado TEXT NOT NULL DEFAULT 'Borrador', valor REAL NOT NULL DEFAULT 0, observaciones TEXT DEFAULT '',
 creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id),
 FOREIGN KEY(cotizacion_id) REFERENCES cotizaciones(id), FOREIGN KEY(suscripcion_id) REFERENCES suscripciones(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id));
 CREATE UNIQUE INDEX IF NOT EXISTS uq_contratos_empresa_codigo ON contratos(empresa_id,codigo) WHERE codigo<>'';
 CREATE INDEX IF NOT EXISTS idx_contratos_empresa_estado ON contratos(empresa_id,estado);
 CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON contratos(cliente_id);
 CREATE INDEX IF NOT EXISTS idx_contratos_suscripcion ON contratos(suscripcion_id);`);
 const roles=['Administrador','Supervisor','Comercial','Operador','Consulta'];
 for(const nombre of roles)db.prepare('INSERT OR IGNORE INTO roles(nombre) VALUES(?)').run(nombre);
 const actions=[['ver','Ver'],['crear','Crear'],['editar','Editar'],['eliminar','Eliminar'],['exportar','Exportar']];let n=0;
 for(const [accion,nombre] of actions){const x=db.prepare('INSERT OR IGNORE INTO permisos(codigo,nombre,modulo,accion) VALUES(?,?,?,?)').run(`contratos.${accion}`,`${nombre} Contratos`,'contratos',accion);if(x.changes)n+=x.changes}
 const admin=db.prepare("SELECT id FROM roles WHERE nombre='Administrador'").get();
 if(admin)for(const p of db.prepare("SELECT id FROM permisos WHERE modulo='contratos'").all())db.prepare('INSERT OR IGNORE INTO rol_permisos(rol_id,permiso_id) VALUES(?,?)').run(admin.id,p.id);
 console.log(`Migración Fase 16.8 completada correctamente.${n?` Se agregaron ${n} permiso(s).`:''}`);
}finally{db.close()}
