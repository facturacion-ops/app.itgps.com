const Database = require('better-sqlite3');
const db = new Database('./data/itgps.db');
try {
  db.exec(`CREATE TABLE IF NOT EXISTS facturas(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, cotizacion_id INTEGER,
    codigo TEXT NOT NULL DEFAULT '', fecha_emision TEXT NOT NULL, fecha_vencimiento TEXT DEFAULT '', estado TEXT NOT NULL DEFAULT 'Borrador',
    subtotal REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, impuestos REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
    observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(cotizacion_id) REFERENCES cotizaciones(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_facturas_empresa_codigo ON facturas(empresa_id,codigo) WHERE codigo <> '';
  CREATE UNIQUE INDEX IF NOT EXISTS uq_facturas_cotizacion ON facturas(cotizacion_id) WHERE cotizacion_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_facturas_empresa_estado ON facturas(empresa_id,estado);
  CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);
  CREATE TABLE IF NOT EXISTS factura_detalles(
    id INTEGER PRIMARY KEY AUTOINCREMENT, factura_id INTEGER NOT NULL, servicio_id INTEGER, plan_id INTEGER, descripcion TEXT DEFAULT '',
    cantidad REAL NOT NULL DEFAULT 1, precio_unitario REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL DEFAULT 0, orden INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(factura_id) REFERENCES facturas(id) ON DELETE CASCADE, FOREIGN KEY(servicio_id) REFERENCES servicios(id), FOREIGN KEY(plan_id) REFERENCES planes(id)
  );
  CREATE INDEX IF NOT EXISTS idx_factura_detalles_factura ON factura_detalles(factura_id);`);
  const roles=['Administrador','Supervisor','Comercial','Operador','Consulta'];
  const actions=[['ver','Ver'],['crear','Crear'],['editar','Editar'],['eliminar','Eliminar'],['exportar','Exportar']];
  const roleIds=db.prepare("SELECT id,nombre FROM roles").all();
  let nuevos=0;
  for(const [accion,nombreAccion] of actions){
    const r=db.prepare("INSERT OR IGNORE INTO permisos(codigo,nombre,modulo,accion) VALUES(?,?,?,?)").run(`facturas.${accion}`,`${nombreAccion} Facturación`,'facturas',accion);
    if(r.changes)nuevos++;
  }
  const admin=db.prepare("SELECT id FROM roles WHERE nombre='Administrador'").get();
  if(admin) for(const p of db.prepare("SELECT id FROM permisos WHERE modulo='facturas'").all()) db.prepare("INSERT OR IGNORE INTO rol_permisos(rol_id,permiso_id) VALUES(?,?)").run(admin.id,p.id);
  console.log('Migración Fase 16.6 completada correctamente.');
  if(nuevos) console.log(`Agregados: ${nuevos} permiso(s) de facturación.`);
} finally { db.close(); }
