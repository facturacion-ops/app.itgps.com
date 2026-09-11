CREATE TABLE IF NOT EXISTS empresas(id INTEGER PRIMARY KEY AUTOINCREMENT,nombre TEXT NOT NULL,nit TEXT,estado INTEGER NOT NULL DEFAULT 1,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS roles(id INTEGER PRIMARY KEY AUTOINCREMENT,nombre TEXT NOT NULL UNIQUE,estado INTEGER NOT NULL DEFAULT 1,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS permisos(id INTEGER PRIMARY KEY AUTOINCREMENT,codigo TEXT NOT NULL UNIQUE,nombre TEXT NOT NULL,modulo TEXT NOT NULL,accion TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rol_permisos(rol_id INTEGER NOT NULL,permiso_id INTEGER NOT NULL,PRIMARY KEY(rol_id,permiso_id),FOREIGN KEY(rol_id) REFERENCES roles(id) ON DELETE CASCADE,FOREIGN KEY(permiso_id) REFERENCES permisos(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS usuarios(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,rol_id INTEGER NOT NULL,nombre TEXT NOT NULL,apellido TEXT,password_hash TEXT NOT NULL,correo TEXT NOT NULL,estado INTEGER DEFAULT 1,ultimo_login TEXT,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(empresa_id,correo),FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(rol_id) REFERENCES roles(id));
CREATE TABLE IF NOT EXISTS sesiones(id INTEGER PRIMARY KEY AUTOINCREMENT,usuario_id INTEGER NOT NULL,token_jti TEXT UNIQUE NOT NULL,fecha_inicio TEXT DEFAULT CURRENT_TIMESTAMP,fecha_expira TEXT NOT NULL,fecha_cierre TEXT,ip TEXT,user_agent TEXT,FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS auditoria(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 empresa_id INTEGER,
 usuario_id INTEGER,
 accion TEXT NOT NULL,
 modulo TEXT,
 detalle TEXT,
 ip TEXT,
 fecha TEXT DEFAULT CURRENT_TIMESTAMP,
 resultado TEXT NOT NULL DEFAULT 'OK',
 metodo TEXT DEFAULT '',
 ruta TEXT DEFAULT '',
 user_agent TEXT DEFAULT '',
 entidad TEXT DEFAULT '',
 entidad_id INTEGER,
 datos_antes TEXT DEFAULT '',
 datos_despues TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS recuperacion_password(id INTEGER PRIMARY KEY AUTOINCREMENT,usuario_id INTEGER NOT NULL,token_hash TEXT UNIQUE NOT NULL,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_expira TEXT NOT NULL,fecha_uso TEXT,FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS clientes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL,
  codigo TEXT NOT NULL DEFAULT '',
  nombre TEXT NOT NULL,
  nit TEXT DEFAULT '',
  razon_social TEXT DEFAULT '',
  nombre_comercial TEXT DEFAULT '',
  digito_verificacion TEXT DEFAULT '',
  actividad_economica TEXT DEFAULT '',
  departamento TEXT DEFAULT '',
  sitio_web TEXT DEFAULT '',
  tipo_cliente TEXT NOT NULL DEFAULT 'Empresa',
  contacto TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  correo TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  ciudad TEXT DEFAULT '',
  estado INTEGER NOT NULL DEFAULT 1,
  observaciones TEXT DEFAULT '',
  creado_por INTEGER,
  fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(empresa_id) REFERENCES empresas(id),
  FOREIGN KEY(creado_por) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS prospectos(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,codigo TEXT NOT NULL DEFAULT '',nombre TEXT NOT NULL,tipo_prospecto TEXT NOT NULL DEFAULT 'Empresa',nit TEXT DEFAULT '',contacto TEXT DEFAULT '',telefono TEXT DEFAULT '',correo TEXT DEFAULT '',ciudad TEXT DEFAULT '',direccion TEXT DEFAULT '',origen TEXT DEFAULT 'Otro',etapa TEXT NOT NULL DEFAULT 'Nuevo',estado INTEGER NOT NULL DEFAULT 1,responsable_id INTEGER,proxima_gestion TEXT DEFAULT '',observaciones TEXT DEFAULT '',convertido_cliente_id INTEGER,creado_por INTEGER,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(responsable_id) REFERENCES usuarios(id),FOREIGN KEY(creado_por) REFERENCES usuarios(id),FOREIGN KEY(convertido_cliente_id) REFERENCES clientes(id));
CREATE TABLE IF NOT EXISTS equipos(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,imei TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sim_cards(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,iccid TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notificaciones_email(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER,usuario_id INTEGER,destinatario TEXT NOT NULL,asunto TEXT NOT NULL,cuerpo TEXT NOT NULL,estado TEXT DEFAULT 'PENDIENTE');
CREATE TABLE IF NOT EXISTS push_suscripciones(id INTEGER PRIMARY KEY AUTOINCREMENT,usuario_id INTEGER NOT NULL,endpoint TEXT UNIQUE NOT NULL,p256dh TEXT NOT NULL,auth TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS activos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL,
  cliente_id INTEGER NOT NULL,
  codigo TEXT NOT NULL DEFAULT '',
  placa TEXT DEFAULT '',
  tipo_activo TEXT NOT NULL DEFAULT 'Vehículo',
  marca TEXT DEFAULT '',
  linea TEXT DEFAULT '',
  modelo TEXT DEFAULT '',
  anio INTEGER,
  color TEXT DEFAULT '',
  vin TEXT DEFAULT '',
  numero_motor TEXT DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'Activo',
  fecha_alta TEXT DEFAULT '',
  fecha_baja TEXT DEFAULT '',
  observaciones TEXT DEFAULT '',
  creado_por INTEGER,
  fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(empresa_id) REFERENCES empresas(id),
  FOREIGN KEY(cliente_id) REFERENCES clientes(id),
  FOREIGN KEY(creado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS m2m_planes(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,nombre TEXT NOT NULL,operador TEXT DEFAULT '',descripcion TEXT DEFAULT '',mb_incluidos REAL NOT NULL DEFAULT 0,costo_mensual REAL NOT NULL DEFAULT 0,dia_corte INTEGER NOT NULL DEFAULT 1,alerta_80 REAL NOT NULL DEFAULT 80,alerta_100 REAL NOT NULL DEFAULT 100,estado INTEGER NOT NULL DEFAULT 1,creado_por INTEGER,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(creado_por) REFERENCES usuarios(id));
CREATE TABLE IF NOT EXISTS m2m_consumos(id INTEGER PRIMARY KEY AUTOINCREMENT,sim_id INTEGER NOT NULL,periodo TEXT NOT NULL,mb_consumidos REAL NOT NULL DEFAULT 0,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(sim_id,periodo),FOREIGN KEY(sim_id) REFERENCES sim_cards(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS m2m_alertas(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,sim_id INTEGER NOT NULL,tipo TEXT NOT NULL,periodo TEXT NOT NULL,umbral REAL NOT NULL DEFAULT 0,mensaje TEXT NOT NULL,estado TEXT NOT NULL DEFAULT 'ABIERTA',fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_atencion TEXT,atendida_por INTEGER,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(sim_id) REFERENCES sim_cards(id),FOREIGN KEY(atendida_por) REFERENCES usuarios(id));
CREATE TABLE IF NOT EXISTS m2m_historial_estados(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,sim_id INTEGER NOT NULL,estado_anterior TEXT,estado_nuevo TEXT NOT NULL,motivo TEXT DEFAULT '',usuario_id INTEGER,fecha TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(sim_id) REFERENCES sim_cards(id),FOREIGN KEY(usuario_id) REFERENCES usuarios(id));

CREATE TABLE IF NOT EXISTS cliente_contactos(id INTEGER PRIMARY KEY AUTOINCREMENT,cliente_id INTEGER NOT NULL,nombre TEXT NOT NULL,cargo TEXT DEFAULT '',tipo_contacto TEXT NOT NULL DEFAULT 'Comercial',telefono TEXT DEFAULT '',celular TEXT DEFAULT '',correo TEXT DEFAULT '',principal INTEGER NOT NULL DEFAULT 0,estado INTEGER NOT NULL DEFAULT 1,observaciones TEXT DEFAULT '',creado_por INTEGER,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,FOREIGN KEY(creado_por) REFERENCES usuarios(id));
CREATE INDEX IF NOT EXISTS idx_cliente_contactos_cliente ON cliente_contactos(cliente_id);

CREATE TABLE IF NOT EXISTS servicios(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL,
  codigo TEXT NOT NULL DEFAULT '',
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Otro',
  descripcion TEXT DEFAULT '',
  modalidad TEXT NOT NULL DEFAULT 'Recurrente',
  periodicidad TEXT NOT NULL DEFAULT 'Mensual',
  precio_base REAL NOT NULL DEFAULT 0,
  estado INTEGER NOT NULL DEFAULT 1,
  observaciones TEXT DEFAULT '',
  creado_por INTEGER,
  fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(empresa_id) REFERENCES empresas(id),
  FOREIGN KEY(creado_por) REFERENCES usuarios(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_servicios_empresa_codigo ON servicios(empresa_id,codigo) WHERE codigo <> '';
CREATE INDEX IF NOT EXISTS idx_servicios_empresa_estado ON servicios(empresa_id,estado);
CREATE TABLE IF NOT EXISTS planes(
  id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, servicio_id INTEGER NOT NULL, codigo TEXT NOT NULL DEFAULT '', nombre TEXT NOT NULL, descripcion TEXT DEFAULT '', modalidad TEXT NOT NULL DEFAULT 'Recurrente', periodicidad TEXT NOT NULL DEFAULT 'Mensual', precio REAL NOT NULL DEFAULT 0, costo_instalacion REAL NOT NULL DEFAULT 0, duracion_meses INTEGER NOT NULL DEFAULT 0, estado INTEGER NOT NULL DEFAULT 1, observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(servicio_id) REFERENCES servicios(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_planes_empresa_codigo ON planes(empresa_id,codigo) WHERE codigo <> '';
CREATE INDEX IF NOT EXISTS idx_planes_empresa_estado ON planes(empresa_id,estado);
CREATE INDEX IF NOT EXISTS idx_planes_servicio ON planes(servicio_id);


-- Fase 16.5 -- Cotizaciones (la migración principal se ejecuta al arrancar el servidor)
