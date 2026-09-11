import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./database.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

// Aplica el esquema base, las migraciones de columnas de versiones anteriores y
// garantiza que existan todos los permisos módulo.acción (incluyendo los del rol
// Administrador). Es seguro llamarla en cada arranque del servidor: usa
// "IF NOT EXISTS"/"INSERT OR IGNORE" en todos lados, así que no duplica ni pisa datos.
//
// Por qué existe: antes esta lógica solo vivía en `init.js`, que hay que correr a
// mano con `npm run db:init`. Si se agregaba un módulo nuevo (por ejemplo Activos)
// y el operador olvidaba volver a correr ese comando, los permisos "activos.*"
// nunca se creaban y el rol Administrador tampoco los recibía: cualquier intento
// de crear/editar/ver activos quedaba bloqueado con "Permiso insuficiente", sin
// ningún indicio visible de por qué. Ejecutar las migraciones automáticamente al
// iniciar el servidor evita ese escenario.
export function runMigrations() {
  db.exec(fs.readFileSync(path.join(dir, "schema.sql"), "utf8"));

  const roleColumns = db.prepare("PRAGMA table_info(roles)").all().map(x => x.name);
  if (!roleColumns.includes("estado")) db.exec("ALTER TABLE roles ADD COLUMN estado INTEGER NOT NULL DEFAULT 1");

  const clientColumns = db.prepare("PRAGMA table_info(clientes)").all().map(x => x.name);
  const clientMigrations = [
    ["codigo", "TEXT NOT NULL DEFAULT ''"],
    ["nit", "TEXT DEFAULT ''"],
    ["tipo_cliente", "TEXT NOT NULL DEFAULT 'Empresa'"],
    ["contacto", "TEXT DEFAULT ''"],
    ["telefono", "TEXT DEFAULT ''"],
    ["correo", "TEXT DEFAULT ''"],
    ["direccion", "TEXT DEFAULT ''"],
    ["ciudad", "TEXT DEFAULT ''"],
    ["estado", "INTEGER NOT NULL DEFAULT 1"],
    ["observaciones", "TEXT DEFAULT ''"],
    ["creado_por", "INTEGER"],
    ["fecha_creacion", "TEXT DEFAULT ''"],
    ["fecha_actualizacion", "TEXT DEFAULT ''"]
  ];
  for (const [name, definition] of clientMigrations) if (!clientColumns.includes(name)) db.exec(`ALTER TABLE clientes ADD COLUMN ${name} ${definition}`);

  const prospectColumns = db.prepare("PRAGMA table_info(prospectos)").all().map(x => x.name);
  const prospectMigrations = [["codigo","TEXT NOT NULL DEFAULT ''"],["tipo_prospecto","TEXT NOT NULL DEFAULT 'Empresa'"],["nit","TEXT DEFAULT ''"],["contacto","TEXT DEFAULT ''"],["telefono","TEXT DEFAULT ''"],["correo","TEXT DEFAULT ''"],["ciudad","TEXT DEFAULT ''"],["direccion","TEXT DEFAULT ''"],["origen","TEXT DEFAULT 'Otro'"],["etapa","TEXT NOT NULL DEFAULT 'Nuevo'"],["estado","INTEGER NOT NULL DEFAULT 1"],["responsable_id","INTEGER"],["proxima_gestion","TEXT DEFAULT ''"],["observaciones","TEXT DEFAULT ''"],["convertido_cliente_id","INTEGER"],["creado_por","INTEGER"],["fecha_creacion","TEXT DEFAULT ''"],["fecha_actualizacion","TEXT DEFAULT ''"]];
  for (const [name, definition] of prospectMigrations) if (!prospectColumns.includes(name)) db.exec(`ALTER TABLE prospectos ADD COLUMN ${name} ${definition}`);

  const assetColumns = db.prepare("PRAGMA table_info(activos)").all().map(x => x.name);
  const assetMigrations = [["empresa_id","INTEGER"],["cliente_id","INTEGER"],["codigo","TEXT NOT NULL DEFAULT ''"],["placa","TEXT DEFAULT ''"],["tipo_activo","TEXT NOT NULL DEFAULT 'Vehículo'"],["marca","TEXT DEFAULT ''"],["linea","TEXT DEFAULT ''"],["modelo","TEXT DEFAULT ''"],["anio","INTEGER"],["color","TEXT DEFAULT ''"],["vin","TEXT DEFAULT ''"],["numero_motor","TEXT DEFAULT ''"],["estado","TEXT NOT NULL DEFAULT 'Activo'"],["fecha_alta","TEXT DEFAULT ''"],["fecha_baja","TEXT DEFAULT ''"],["observaciones","TEXT DEFAULT ''"],["creado_por","INTEGER"],["fecha_creacion","TEXT DEFAULT ''"],["fecha_actualizacion","TEXT DEFAULT ''"]];
  for (const [name, definition] of assetMigrations) if (!assetColumns.includes(name)) db.exec(`ALTER TABLE activos ADD COLUMN ${name} ${definition}`);

  const permissionColumns = db.prepare("PRAGMA table_info(permisos)").all().map(x => x.name);
  if (!permissionColumns.includes("modulo")) db.exec("ALTER TABLE permisos ADD COLUMN modulo TEXT NOT NULL DEFAULT ''");
  if (!permissionColumns.includes("accion")) db.exec("ALTER TABLE permisos ADD COLUMN accion TEXT NOT NULL DEFAULT ''");

  // Fase 4.1 — Auditoría avanzada. Se agregan metadatos sin alterar los registros existentes.
  const auditColumns = db.prepare("PRAGMA table_info(auditoria)").all().map(x => x.name);
  const auditMigrations = [
    ["resultado", "TEXT NOT NULL DEFAULT 'OK'"],
    ["metodo", "TEXT DEFAULT ''"],
    ["ruta", "TEXT DEFAULT ''"],
    ["user_agent", "TEXT DEFAULT ''"],
    ["entidad", "TEXT DEFAULT ''"],
    ["entidad_id", "INTEGER"],
    ["datos_antes", "TEXT DEFAULT ''"],
    ["datos_despues", "TEXT DEFAULT ''"]
  ];
  for (const [name, definition] of auditMigrations) {
    if (!auditColumns.includes(name)) db.exec(`ALTER TABLE auditoria ADD COLUMN ${name} ${definition}`);
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_auditoria_empresa_fecha ON auditoria(empresa_id,fecha);
  CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_fecha ON auditoria(usuario_id,fecha);
  CREATE INDEX IF NOT EXISTS idx_auditoria_modulo_accion ON auditoria(modulo,accion);`);

  // Fase 10 — Gestión M2M.
  const simM2mColumns = db.prepare("PRAGMA table_info(sim_cards)").all().map(x => x.name);
  for (const [name, definition] of [["plan_id","INTEGER"],["fecha_corte","INTEGER"]]) if (!simM2mColumns.includes(name)) db.exec(`ALTER TABLE sim_cards ADD COLUMN ${name} ${definition}`);
  db.exec(`CREATE TABLE IF NOT EXISTS m2m_planes(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,nombre TEXT NOT NULL,operador TEXT DEFAULT '',descripcion TEXT DEFAULT '',mb_incluidos REAL NOT NULL DEFAULT 0,costo_mensual REAL NOT NULL DEFAULT 0,dia_corte INTEGER NOT NULL DEFAULT 1,alerta_80 REAL NOT NULL DEFAULT 80,alerta_100 REAL NOT NULL DEFAULT 100,estado INTEGER NOT NULL DEFAULT 1,creado_por INTEGER,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(creado_por) REFERENCES usuarios(id));
  CREATE TABLE IF NOT EXISTS m2m_consumos(id INTEGER PRIMARY KEY AUTOINCREMENT,sim_id INTEGER NOT NULL,periodo TEXT NOT NULL,mb_consumidos REAL NOT NULL DEFAULT 0,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(sim_id,periodo),FOREIGN KEY(sim_id) REFERENCES sim_cards(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS m2m_alertas(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,sim_id INTEGER NOT NULL,tipo TEXT NOT NULL,periodo TEXT NOT NULL,umbral REAL NOT NULL DEFAULT 0,mensaje TEXT NOT NULL,estado TEXT NOT NULL DEFAULT 'ABIERTA',fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_atencion TEXT,atendida_por INTEGER,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(sim_id) REFERENCES sim_cards(id),FOREIGN KEY(atendida_por) REFERENCES usuarios(id));
  CREATE TABLE IF NOT EXISTS m2m_historial_estados(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,sim_id INTEGER NOT NULL,estado_anterior TEXT,estado_nuevo TEXT NOT NULL,motivo TEXT DEFAULT '',usuario_id INTEGER,fecha TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(sim_id) REFERENCES sim_cards(id),FOREIGN KEY(usuario_id) REFERENCES usuarios(id));
  CREATE INDEX IF NOT EXISTS idx_m2m_planes_empresa ON m2m_planes(empresa_id);
  CREATE INDEX IF NOT EXISTS idx_m2m_consumos_periodo ON m2m_consumos(periodo);
  CREATE INDEX IF NOT EXISTS idx_m2m_alertas_empresa_estado ON m2m_alertas(empresa_id,estado);
  CREATE INDEX IF NOT EXISTS idx_m2m_historial_empresa_fecha ON m2m_historial_estados(empresa_id,fecha);`);
  // Fase 16.2 — Catálogo de servicios comerciales.
  db.exec(`CREATE TABLE IF NOT EXISTS servicios(
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
  CREATE INDEX IF NOT EXISTS idx_servicios_empresa_estado ON servicios(empresa_id,estado);`);

  // Fase 16.3 — Catálogo de planes comerciales.
  db.exec(`CREATE TABLE IF NOT EXISTS planes(
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
  CREATE INDEX IF NOT EXISTS idx_planes_servicio ON planes(servicio_id);`);

  // Fase 12.1 — Operación GPS. Se agregan columnas de operación sin alterar datos existentes.
  const equipmentOperationColumns = db.prepare("PRAGMA table_info(equipos)").all().map(x => x.name);
  const equipmentOperationMigrations = [
    ["estado_operacional", "TEXT NOT NULL DEFAULT 'Operativo'"],
    ["estado_conectividad", "TEXT NOT NULL DEFAULT 'Sin comunicación'"],
    ["ultima_comunicacion", "TEXT"],
    ["ultima_latitud", "REAL"],
    ["ultima_longitud", "REAL"],
    ["observaciones_operacion", "TEXT NOT NULL DEFAULT ''"],
    ["fecha_actualizacion_operacion", "TEXT"]
  ];
  for (const [name, definition] of equipmentOperationMigrations) {
    if (!equipmentOperationColumns.includes(name)) db.exec(`ALTER TABLE equipos ADD COLUMN ${name} ${definition}`);
  }

  // Fase 4.3 — Gestión operativa.
  db.exec(`CREATE TABLE IF NOT EXISTS gestion_tareas(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'Tarea',
    titulo TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    prioridad TEXT NOT NULL DEFAULT 'Media',
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    cliente_id INTEGER,
    activo_id INTEGER,
    equipo_id INTEGER,
    sim_id INTEGER,
    responsable_id INTEGER,
    fecha_limite TEXT DEFAULT '',
    fecha_inicio TEXT DEFAULT '',
    fecha_completado TEXT DEFAULT '',
    observaciones TEXT DEFAULT '',
    creado_por INTEGER,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id),
    FOREIGN KEY(cliente_id) REFERENCES clientes(id),
    FOREIGN KEY(activo_id) REFERENCES activos(id),
    FOREIGN KEY(equipo_id) REFERENCES equipos(id),
    FOREIGN KEY(sim_id) REFERENCES sim_cards(id),
    FOREIGN KEY(responsable_id) REFERENCES usuarios(id),
    FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
  CREATE INDEX IF NOT EXISTS idx_gestion_empresa_estado ON gestion_tareas(empresa_id,estado);
  CREATE INDEX IF NOT EXISTS idx_gestion_responsable_estado ON gestion_tareas(responsable_id,estado);
  CREATE INDEX IF NOT EXISTS idx_gestion_fecha_limite ON gestion_tareas(fecha_limite);`);
  // Fase 16.4 — Suscripciones comerciales.
  db.exec(`CREATE TABLE IF NOT EXISTS suscripciones(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, plan_id INTEGER NOT NULL,
    codigo TEXT NOT NULL DEFAULT '', fecha_inicio TEXT NOT NULL, fecha_fin TEXT DEFAULT '', cantidad INTEGER NOT NULL DEFAULT 1,
    precio REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, dia_facturacion INTEGER NOT NULL DEFAULT 1,
    renovacion_automatica INTEGER NOT NULL DEFAULT 0, estado TEXT NOT NULL DEFAULT 'Activa', observaciones TEXT DEFAULT '',
    creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(plan_id) REFERENCES planes(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );`);

  // Compatibilidad incremental — algunas BD existentes de Fase 16.4 fueron creadas
  // antes de incorporar una o más columnas de suscripciones. Primero se agregan las
  // columnas faltantes y SOLO DESPUÉS se crean índices que dependen de ellas.
  // No se recrea la tabla ni se modifica ningún dato existente.
  const subscriptionColumns = db.prepare("PRAGMA table_info(suscripciones)").all().map(x => x.name);
  const subscriptionMigrations = [
    ["empresa_id", "INTEGER"],
    ["cliente_id", "INTEGER"],
    ["plan_id", "INTEGER"],
    ["codigo", "TEXT NOT NULL DEFAULT ''"],
    ["fecha_inicio", "TEXT NOT NULL DEFAULT ''"],
    ["fecha_fin", "TEXT DEFAULT ''"],
    ["cantidad", "INTEGER NOT NULL DEFAULT 1"],
    ["precio", "REAL NOT NULL DEFAULT 0"],
    ["descuento", "REAL NOT NULL DEFAULT 0"],
    ["dia_facturacion", "INTEGER NOT NULL DEFAULT 1"],
    ["renovacion_automatica", "INTEGER NOT NULL DEFAULT 0"],
    ["estado", "TEXT NOT NULL DEFAULT 'Activa'"],
    ["observaciones", "TEXT DEFAULT ''"],
    ["creado_por", "INTEGER"],
    ["fecha_creacion", "TEXT DEFAULT CURRENT_TIMESTAMP"],
    ["fecha_actualizacion", "TEXT DEFAULT CURRENT_TIMESTAMP"]
  ];
  for (const [name, definition] of subscriptionMigrations) {
    if (!subscriptionColumns.includes(name)) db.exec(`ALTER TABLE suscripciones ADD COLUMN ${name} ${definition}`);
  }
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS uq_suscripciones_empresa_codigo ON suscripciones(empresa_id,codigo) WHERE codigo <> '';
  CREATE INDEX IF NOT EXISTS idx_suscripciones_empresa_estado ON suscripciones(empresa_id,estado);
  CREATE INDEX IF NOT EXISTS idx_suscripciones_cliente ON suscripciones(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_suscripciones_plan ON suscripciones(plan_id);`);

  // Fase 16.5 — Cotizaciones comerciales.
  db.exec(`CREATE TABLE IF NOT EXISTS cotizaciones(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, codigo TEXT NOT NULL DEFAULT '',
    fecha TEXT NOT NULL, vigencia_dias INTEGER NOT NULL DEFAULT 15, fecha_vencimiento TEXT DEFAULT '', responsable_id INTEGER,
    estado TEXT NOT NULL DEFAULT 'Borrador', subtotal REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, impuestos REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
    condiciones TEXT DEFAULT '', observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(responsable_id) REFERENCES usuarios(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_cotizaciones_empresa_codigo ON cotizaciones(empresa_id,codigo) WHERE codigo <> '';
  CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa_estado ON cotizaciones(empresa_id,estado);
  CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id);
  CREATE TABLE IF NOT EXISTS cotizacion_detalles(
    id INTEGER PRIMARY KEY AUTOINCREMENT, cotizacion_id INTEGER NOT NULL, servicio_id INTEGER, plan_id INTEGER, descripcion TEXT DEFAULT '',
    cantidad REAL NOT NULL DEFAULT 1, precio_unitario REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL DEFAULT 0, orden INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE, FOREIGN KEY(servicio_id) REFERENCES servicios(id), FOREIGN KEY(plan_id) REFERENCES planes(id)
  );
  CREATE INDEX IF NOT EXISTS idx_cotizacion_detalles_cotizacion ON cotizacion_detalles(cotizacion_id);`);

  // Fase 22 — Cotizaciones para Prospectos. Mantiene compatibilidad con cotizaciones existentes.
  const quoteColumns = db.prepare("PRAGMA table_info(cotizaciones)").all();
  if (quoteColumns.length && !quoteColumns.some(x => x.name === "prospecto_id")) {
    db.exec("ALTER TABLE cotizaciones ADD COLUMN prospecto_id INTEGER REFERENCES prospectos(id)");
  }
  // SQLite no soporta ALTER COLUMN para quitar NOT NULL. En lugar de modificar
  // sqlite_master (operación restringida en varias compilaciones de SQLite), se
  // reconstruye la tabla preservando los datos y los índices. Se desactivan
  // temporalmente las FK durante el reemplazo; al finalizar se vuelven a activar.
  const qinfo = db.prepare("PRAGMA table_info(cotizaciones)").all();
  const qclient = qinfo.find(x => x.name === "cliente_id");
  if (qclient && Number(qclient.notnull) === 1) {
    const hadProspecto = qinfo.some(x => x.name === "prospecto_id");
    const fkWasOn = Number(db.pragma("foreign_keys", { simple: true })) === 1;
    if (fkWasOn) db.pragma("foreign_keys = OFF");
    try {
      db.exec(`CREATE TABLE cotizaciones_new(
        id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER, prospecto_id INTEGER REFERENCES prospectos(id), codigo TEXT NOT NULL DEFAULT '',
        fecha TEXT NOT NULL, vigencia_dias INTEGER NOT NULL DEFAULT 15, fecha_vencimiento TEXT DEFAULT '', responsable_id INTEGER,
        estado TEXT NOT NULL DEFAULT 'Borrador', subtotal REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, impuestos REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
        condiciones TEXT DEFAULT '', observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(responsable_id) REFERENCES usuarios(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
      );`);
      const sourceProspecto = hadProspecto ? 'prospecto_id' : 'NULL';
      db.exec(`INSERT INTO cotizaciones_new(id,empresa_id,cliente_id,prospecto_id,codigo,fecha,vigencia_dias,fecha_vencimiento,responsable_id,estado,subtotal,descuento,impuestos,total,condiciones,observaciones,creado_por,fecha_creacion,fecha_actualizacion)
        SELECT id,empresa_id,cliente_id,${sourceProspecto},codigo,fecha,vigencia_dias,fecha_vencimiento,responsable_id,estado,subtotal,descuento,impuestos,total,condiciones,observaciones,creado_por,fecha_creacion,fecha_actualizacion
        FROM cotizaciones;`);
      db.exec(`DROP TABLE cotizaciones; ALTER TABLE cotizaciones_new RENAME TO cotizaciones;`);
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS uq_cotizaciones_empresa_codigo ON cotizaciones(empresa_id,codigo) WHERE codigo <> '';
        CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa_estado ON cotizaciones(empresa_id,estado);
        CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id);
        CREATE INDEX IF NOT EXISTS idx_cotizaciones_prospecto ON cotizaciones(prospecto_id);`);
    } finally {
      if (fkWasOn) db.pragma("foreign_keys = ON");
    }
  }
  // El índice idx_cotizaciones_prospecto ya se crea dentro de la reconstrucción;
  // IF NOT EXISTS lo hace idempotente si la migración ya quedó aplicada.
  db.exec(`CREATE INDEX IF NOT EXISTS idx_cotizaciones_prospecto ON cotizaciones(prospecto_id);`);

  // Fase 16.6 — Facturación comercial.
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

  // Fase 20.2 — Facturación recurrente, suscripciones, generación masiva y períodos.
  // Estructura incremental: agrega únicamente columnas/tablas/índices faltantes.
  const invoiceColumns = db.prepare("PRAGMA table_info(facturas)").all().map(x => x.name);
  if (!invoiceColumns.includes("suscripcion_id")) db.exec("ALTER TABLE facturas ADD COLUMN suscripcion_id INTEGER");
  if (!invoiceColumns.includes("periodo_facturacion")) db.exec("ALTER TABLE facturas ADD COLUMN periodo_facturacion TEXT DEFAULT ''");
  db.exec(`CREATE INDEX IF NOT EXISTS idx_facturas_suscripcion ON facturas(suscripcion_id);
  CREATE INDEX IF NOT EXISTS idx_facturas_periodo ON facturas(empresa_id,periodo_facturacion);
  CREATE UNIQUE INDEX IF NOT EXISTS uq_facturas_suscripcion_periodo ON facturas(empresa_id,suscripcion_id,periodo_facturacion) WHERE suscripcion_id IS NOT NULL AND periodo_facturacion <> '';
  CREATE TABLE IF NOT EXISTS facturacion_periodos(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    periodo TEXT NOT NULL,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Abierto',
    fecha_apertura TEXT DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TEXT,
    abierto_por INTEGER,
    cerrado_por INTEGER,
    observaciones TEXT DEFAULT '',
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id),
    FOREIGN KEY(abierto_por) REFERENCES usuarios(id),
    FOREIGN KEY(cerrado_por) REFERENCES usuarios(id)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_facturacion_periodos_empresa_periodo ON facturacion_periodos(empresa_id,periodo);
  CREATE INDEX IF NOT EXISTS idx_facturacion_periodos_empresa_estado ON facturacion_periodos(empresa_id,estado);
  CREATE TABLE IF NOT EXISTS facturacion_lotes(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    periodo_id INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Completado',
    estado_inicial_factura TEXT NOT NULL DEFAULT 'Borrador',
    dias_vencimiento INTEGER NOT NULL DEFAULT 0,
    total_candidatas INTEGER NOT NULL DEFAULT 0,
    total_generadas INTEGER NOT NULL DEFAULT 0,
    total_omitidas INTEGER NOT NULL DEFAULT 0,
    creado_por INTEGER,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id),
    FOREIGN KEY(periodo_id) REFERENCES facturacion_periodos(id),
    FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
  CREATE INDEX IF NOT EXISTS idx_facturacion_lotes_empresa_periodo ON facturacion_lotes(empresa_id,periodo_id);
  CREATE TABLE IF NOT EXISTS facturacion_lote_detalles(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id INTEGER NOT NULL,
    suscripcion_id INTEGER,
    factura_id INTEGER,
    estado TEXT NOT NULL,
    motivo TEXT DEFAULT '',
    FOREIGN KEY(lote_id) REFERENCES facturacion_lotes(id) ON DELETE CASCADE,
    FOREIGN KEY(suscripcion_id) REFERENCES suscripciones(id),
    FOREIGN KEY(factura_id) REFERENCES facturas(id)
  );
  CREATE INDEX IF NOT EXISTS idx_facturacion_lote_detalles_lote ON facturacion_lote_detalles(lote_id);`);

  // Fase 26 — Facturación recurrente + cartera V1. Configuración operativa incremental.
  db.exec(`CREATE TABLE IF NOT EXISTS facturacion_config(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL UNIQUE,
    activo INTEGER NOT NULL DEFAULT 1,
    dia_ejecucion INTEGER NOT NULL DEFAULT 1,
    dias_vencimiento INTEGER NOT NULL DEFAULT 0,
    estado_inicial TEXT NOT NULL DEFAULT 'Emitida',
    actualizar_vencidas INTEGER NOT NULL DEFAULT 1,
    fecha_ultima_ejecucion TEXT,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id)
  );
  CREATE INDEX IF NOT EXISTS idx_facturacion_config_empresa ON facturacion_config(empresa_id);`);
  db.prepare(`INSERT OR IGNORE INTO facturacion_config(empresa_id) SELECT id FROM empresas`).run();

  // Fase 20.1 — Cartera y pagos. Estructura incremental; no recrea ni modifica datos existentes.
  db.exec(`CREATE TABLE IF NOT EXISTS pagos_cartera(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    factura_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    fecha_pago TEXT NOT NULL,
    medio_pago TEXT NOT NULL DEFAULT 'Transferencia bancaria',
    referencia TEXT DEFAULT '',
    valor REAL NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'Aplicado',
    observaciones TEXT DEFAULT '',
    creado_por INTEGER,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id),
    FOREIGN KEY(factura_id) REFERENCES facturas(id),
    FOREIGN KEY(cliente_id) REFERENCES clientes(id),
    FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
  CREATE INDEX IF NOT EXISTS idx_pagos_cartera_empresa_fecha ON pagos_cartera(empresa_id,fecha_pago);
  CREATE INDEX IF NOT EXISTS idx_pagos_cartera_factura ON pagos_cartera(factura_id);
  CREATE INDEX IF NOT EXISTS idx_pagos_cartera_cliente ON pagos_cartera(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_pagos_cartera_estado ON pagos_cartera(estado);`);

  // Fase 16.7 — Renovaciones comerciales. No modifica ni recrea datos existentes.
  db.exec(`CREATE TABLE IF NOT EXISTS renovaciones(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, suscripcion_id INTEGER NOT NULL, plan_id INTEGER NOT NULL,
    codigo TEXT NOT NULL DEFAULT '', factura_id INTEGER, fecha_renovacion TEXT NOT NULL, fecha_anterior_fin TEXT DEFAULT '', nueva_fecha_inicio TEXT NOT NULL, nueva_fecha_fin TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1, precio REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'Procesada', observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(suscripcion_id) REFERENCES suscripciones(id), FOREIGN KEY(plan_id) REFERENCES planes(id), FOREIGN KEY(factura_id) REFERENCES facturas(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_renovaciones_empresa_codigo ON renovaciones(empresa_id,codigo) WHERE codigo <> '';
  CREATE INDEX IF NOT EXISTS idx_renovaciones_empresa_estado ON renovaciones(empresa_id,estado);
  CREATE INDEX IF NOT EXISTS idx_renovaciones_cliente ON renovaciones(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_renovaciones_suscripcion ON renovaciones(suscripcion_id);`);
  const renewalColumns = db.prepare("PRAGMA table_info(renovaciones)").all().map(x => x.name);
  if (!renewalColumns.includes("factura_id")) db.exec("ALTER TABLE renovaciones ADD COLUMN factura_id INTEGER");

  // Fase 16.8 — Contratos comerciales. Conserva la BD existente y crea solo la estructura faltante.
  db.exec(`CREATE TABLE IF NOT EXISTS contratos(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, cotizacion_id INTEGER, suscripcion_id INTEGER,
    codigo TEXT NOT NULL DEFAULT '', titulo TEXT NOT NULL DEFAULT '', fecha_inicio TEXT NOT NULL, fecha_fin TEXT DEFAULT '', estado TEXT NOT NULL DEFAULT 'Borrador',
    valor REAL NOT NULL DEFAULT 0, observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(cotizacion_id) REFERENCES cotizaciones(id), FOREIGN KEY(suscripcion_id) REFERENCES suscripciones(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id));
  CREATE UNIQUE INDEX IF NOT EXISTS uq_contratos_empresa_codigo ON contratos(empresa_id,codigo) WHERE codigo <> '';
  CREATE INDEX IF NOT EXISTS idx_contratos_empresa_estado ON contratos(empresa_id,estado); CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON contratos(cliente_id); CREATE INDEX IF NOT EXISTS idx_contratos_suscripcion ON contratos(suscripcion_id);`);

  // Fase 17.1 — Órdenes de servicio. Conserva la BD existente y crea solo la estructura faltante.
  db.exec(`CREATE TABLE IF NOT EXISTS ordenes_servicio(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, contrato_id INTEGER, activo_id INTEGER, codigo TEXT NOT NULL DEFAULT '',
    tipo TEXT NOT NULL DEFAULT 'Instalación', prioridad TEXT NOT NULL DEFAULT 'Media',
    titulo TEXT NOT NULL, descripcion TEXT DEFAULT '', fecha_solicitud TEXT NOT NULL,
    fecha_programada TEXT DEFAULT '', estado TEXT NOT NULL DEFAULT 'Borrador',
    responsable_id INTEGER, observaciones TEXT DEFAULT '', creado_por INTEGER,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id),
    FOREIGN KEY(contrato_id) REFERENCES contratos(id), FOREIGN KEY(activo_id) REFERENCES activos(id),
    FOREIGN KEY(responsable_id) REFERENCES usuarios(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_ordenes_servicio_empresa_codigo ON ordenes_servicio(empresa_id,id);
  CREATE INDEX IF NOT EXISTS idx_ordenes_servicio_empresa_estado ON ordenes_servicio(empresa_id,estado);
  CREATE INDEX IF NOT EXISTS idx_ordenes_servicio_cliente ON ordenes_servicio(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_ordenes_servicio_contrato ON ordenes_servicio(contrato_id);
  CREATE INDEX IF NOT EXISTS idx_ordenes_servicio_activo ON ordenes_servicio(activo_id);`);

  // Fase 18.1 — Marca blanca por empresa.
  // Tabla independiente para complementar los datos existentes de empresas sin duplicarlos.
  db.exec(`CREATE TABLE IF NOT EXISTS empresa_marca(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL UNIQUE,
    nombre_aplicacion TEXT NOT NULL DEFAULT '',
    nombre_comercial TEXT NOT NULL DEFAULT '',
    logo_principal TEXT NOT NULL DEFAULT '',
    logo_secundario TEXT NOT NULL DEFAULT '',
    favicon TEXT NOT NULL DEFAULT '',
    color_principal TEXT NOT NULL DEFAULT '#0A1E2E',
    color_secundario TEXT NOT NULL DEFAULT '#F5F8FA',
    color_acento TEXT NOT NULL DEFAULT '#8CF63C',
    encabezado TEXT NOT NULL DEFAULT '',
    pie_pagina TEXT NOT NULL DEFAULT '',
    texto_legal TEXT NOT NULL DEFAULT '',
    terminos_condiciones TEXT NOT NULL DEFAULT '',
    firma_nombre TEXT NOT NULL DEFAULT '',
    firma_cargo TEXT NOT NULL DEFAULT '',
    datos_bancarios TEXT NOT NULL DEFAULT '',
    moneda TEXT NOT NULL DEFAULT 'COP',
    formato_fecha TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    formato_numerico TEXT NOT NULL DEFAULT 'es-CO',
    zona_horaria TEXT NOT NULL DEFAULT 'America/Bogota',
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_empresa_marca_empresa ON empresa_marca(empresa_id);`);

  // Fase 18.3 — Plantillas de documentos por empresa.
  db.exec(`CREATE TABLE IF NOT EXISTS plantillas_documentos(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    tipo_documento TEXT NOT NULL DEFAULT 'REPORTE',
    descripcion TEXT NOT NULL DEFAULT '',
    estado INTEGER NOT NULL DEFAULT 1,
    predeterminada INTEGER NOT NULL DEFAULT 0,
    configuracion TEXT NOT NULL DEFAULT '{}',
    creado_por INTEGER,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
  CREATE INDEX IF NOT EXISTS idx_plantillas_documentos_empresa_tipo ON plantillas_documentos(empresa_id,tipo_documento);
  CREATE INDEX IF NOT EXISTS idx_plantillas_documentos_empresa_estado ON plantillas_documentos(empresa_id,estado);`);

  // Fase 18.5 — Reportes personalizados. Estructura aislada por empresa; no modifica datos existentes.
  db.exec(`CREATE TABLE IF NOT EXISTS reportes_personalizados(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    fuente TEXT NOT NULL,
    estado INTEGER NOT NULL DEFAULT 1,
    configuracion TEXT NOT NULL DEFAULT '{}',
    creado_por INTEGER,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
  CREATE INDEX IF NOT EXISTS idx_reportes_personalizados_empresa ON reportes_personalizados(empresa_id);
  CREATE INDEX IF NOT EXISTS idx_reportes_personalizados_empresa_estado ON reportes_personalizados(empresa_id,estado);`);

  // Fase 21.1 V2 — Integridad financiera. Protege nuevas escrituras sin alterar datos existentes.
  // Regla: factura y pago deben pertenecer a la misma empresa y cliente.
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_facturas_empresa_cliente_insert
    BEFORE INSERT ON facturas
    WHEN NOT EXISTS (SELECT 1 FROM clientes c WHERE c.id=NEW.cliente_id AND c.empresa_id=NEW.empresa_id)
    BEGIN SELECT RAISE(ABORT,'Integridad financiera: el cliente no pertenece a la empresa de la factura.'); END;
    CREATE TRIGGER IF NOT EXISTS trg_facturas_empresa_cliente_update
    BEFORE UPDATE OF empresa_id,cliente_id ON facturas
    WHEN NOT EXISTS (SELECT 1 FROM clientes c WHERE c.id=NEW.cliente_id AND c.empresa_id=NEW.empresa_id)
    BEGIN SELECT RAISE(ABORT,'Integridad financiera: el cliente no pertenece a la empresa de la factura.'); END;
    CREATE TRIGGER IF NOT EXISTS trg_pagos_integridad_insert
    BEFORE INSERT ON pagos_cartera
    WHEN NOT EXISTS (SELECT 1 FROM facturas f WHERE f.id=NEW.factura_id AND f.empresa_id=NEW.empresa_id AND f.cliente_id=NEW.cliente_id)
    BEGIN SELECT RAISE(ABORT,'Integridad financiera: el pago no coincide con empresa, factura y cliente.'); END;
    CREATE TRIGGER IF NOT EXISTS trg_pagos_integridad_update
    BEFORE UPDATE OF empresa_id,factura_id,cliente_id ON pagos_cartera
    WHEN NOT EXISTS (SELECT 1 FROM facturas f WHERE f.id=NEW.factura_id AND f.empresa_id=NEW.empresa_id AND f.cliente_id=NEW.cliente_id)
    BEGIN SELECT RAISE(ABORT,'Integridad financiera: el pago no coincide con empresa, factura y cliente.'); END;
    CREATE INDEX IF NOT EXISTS idx_facturas_empresa_cliente ON facturas(empresa_id,cliente_id);
    CREATE INDEX IF NOT EXISTS idx_pagos_empresa_factura_cliente ON pagos_cartera(empresa_id,factura_id,cliente_id);
  `);

  // Fase 28 — Integraciones GPS / M2M. Capa agnóstica por empresa; no depende de una plataforma GPS concreta.
  db.exec(`
    CREATE TABLE IF NOT EXISTS integraciones(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'GPS',
      proveedor TEXT DEFAULT '',
      protocolo TEXT NOT NULL DEFAULT 'REST_JSON',
      base_url TEXT DEFAULT '',
      auth_tipo TEXT NOT NULL DEFAULT 'BEARER',
      auth_token TEXT DEFAULT '',
      dispositivos_path TEXT DEFAULT '/devices',
      consumo_path TEXT DEFAULT '/sim/consumption',
      timeout_ms INTEGER NOT NULL DEFAULT 10000,
      estado INTEGER NOT NULL DEFAULT 1,
      webhook_token TEXT NOT NULL UNIQUE,
      ultima_sincronizacion TEXT,
      ultimo_resultado TEXT DEFAULT '',
      ultimo_error TEXT DEFAULT '',
      notas TEXT DEFAULT '',
      creado_por INTEGER,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
      FOREIGN KEY(creado_por) REFERENCES usuarios(id)
    );
    CREATE TABLE IF NOT EXISTS integracion_mapeos(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      integracion_id INTEGER NOT NULL,
      tipo_entidad TEXT NOT NULL DEFAULT 'GPS',
      identificador_externo TEXT NOT NULL,
      equipo_id INTEGER,
      sim_id INTEGER,
      imei_externo TEXT DEFAULT '',
      ultimo_estado TEXT DEFAULT '',
      ultima_sincronizacion TEXT,
      estado INTEGER NOT NULL DEFAULT 1,
      fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(integracion_id,identificador_externo),
      FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
      FOREIGN KEY(integracion_id) REFERENCES integraciones(id) ON DELETE CASCADE,
      FOREIGN KEY(equipo_id) REFERENCES equipos(id) ON DELETE SET NULL,
      FOREIGN KEY(sim_id) REFERENCES sim_cards(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS integracion_logs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      integracion_id INTEGER NOT NULL,
      operacion TEXT NOT NULL,
      resultado TEXT NOT NULL DEFAULT 'OK',
      mensaje TEXT DEFAULT '',
      http_status INTEGER,
      duracion_ms INTEGER DEFAULT 0,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
      FOREIGN KEY(integracion_id) REFERENCES integraciones(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS gps_integracion_eventos(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER NOT NULL,
      integracion_id INTEGER NOT NULL,
      identificador_externo TEXT NOT NULL,
      evento TEXT NOT NULL DEFAULT 'POSICION',
      latitud REAL,
      longitud REAL,
      velocidad REAL DEFAULT 0,
      ignicion INTEGER,
      bateria REAL,
      fecha_evento TEXT,
      payload_json TEXT DEFAULT '',
      procesado INTEGER NOT NULL DEFAULT 1,
      fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
      FOREIGN KEY(integracion_id) REFERENCES integraciones(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_integraciones_empresa_estado ON integraciones(empresa_id,estado);
    CREATE INDEX IF NOT EXISTS idx_integracion_mapeos_empresa ON integracion_mapeos(empresa_id,estado);
    CREATE INDEX IF NOT EXISTS idx_integracion_logs_empresa_fecha ON integracion_logs(empresa_id,fecha);
    CREATE INDEX IF NOT EXISTS idx_gps_integracion_eventos_empresa_fecha ON gps_integracion_eventos(empresa_id,fecha_recepcion);
  `);

  // Fase 29 — Seguridad + Producción. Configuración central por empresa; no destructiva.
  db.exec(`CREATE TABLE IF NOT EXISTS configuracion_empresa(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL UNIQUE,
    app_nombre TEXT NOT NULL DEFAULT 'IT GPS APP', zona_horaria TEXT NOT NULL DEFAULT 'America/Bogota',
    formato_fecha TEXT NOT NULL DEFAULT 'DD/MM/YYYY', formato_numerico TEXT NOT NULL DEFAULT 'es-CO', moneda TEXT NOT NULL DEFAULT 'COP', idioma TEXT NOT NULL DEFAULT 'es-CO',
    session_minutes INTEGER NOT NULL DEFAULT 480, max_login_attempts INTEGER NOT NULL DEFAULT 5, lock_minutes INTEGER NOT NULL DEFAULT 15,
    password_min_length INTEGER NOT NULL DEFAULT 8, password_upper INTEGER NOT NULL DEFAULT 0, password_lower INTEGER NOT NULL DEFAULT 0, password_number INTEGER NOT NULL DEFAULT 0, password_special INTEGER NOT NULL DEFAULT 0,
    audit_retention_days INTEGER NOT NULL DEFAULT 365, api_rate_limit INTEGER NOT NULL DEFAULT 120,
    email_remitente TEXT NOT NULL DEFAULT '', email_nombre TEXT NOT NULL DEFAULT '', notificaciones_activas INTEGER NOT NULL DEFAULT 0,
    backup_habilitado INTEGER NOT NULL DEFAULT 0, backup_retencion_dias INTEGER NOT NULL DEFAULT 30,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS seguridad_login_intentos(
    id INTEGER PRIMARY KEY AUTOINCREMENT, correo TEXT NOT NULL, ip TEXT NOT NULL DEFAULT '', fallos INTEGER NOT NULL DEFAULT 0, bloqueado_hasta TEXT, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(correo,ip)
  );
  CREATE INDEX IF NOT EXISTS idx_login_intentos_bloqueo ON seguridad_login_intentos(correo,ip,bloqueado_hasta);`);

  // Fase 29.1 — Notificaciones empresariales: SMTP, eventos y plantillas. No destructiva.
  db.exec(`CREATE TABLE IF NOT EXISTS notificaciones_smtp(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL UNIQUE, smtp_host TEXT NOT NULL DEFAULT '', smtp_port INTEGER NOT NULL DEFAULT 587, smtp_secure TEXT NOT NULL DEFAULT 'starttls', smtp_usuario TEXT NOT NULL DEFAULT '', smtp_password_enc TEXT NOT NULL DEFAULT '', smtp_rechazar_certificado INTEGER NOT NULL DEFAULT 1, remitente_email TEXT NOT NULL DEFAULT '', remitente_nombre TEXT NOT NULL DEFAULT '', reply_to TEXT NOT NULL DEFAULT '', activo INTEGER NOT NULL DEFAULT 0, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS notificaciones_eventos(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, codigo TEXT NOT NULL, nombre TEXT NOT NULL, descripcion TEXT NOT NULL DEFAULT '', activo INTEGER NOT NULL DEFAULT 1, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(empresa_id,codigo), FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS notificaciones_plantillas(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, evento_codigo TEXT NOT NULL, nombre TEXT NOT NULL, asunto TEXT NOT NULL, cuerpo_html TEXT NOT NULL, predeterminada INTEGER NOT NULL DEFAULT 0, activo INTEGER NOT NULL DEFAULT 1, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS notificaciones_historial(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, evento_codigo TEXT NOT NULL, destinatario TEXT NOT NULL, asunto TEXT NOT NULL DEFAULT '', estado TEXT NOT NULL, mensaje_error TEXT NOT NULL DEFAULT '', fecha TEXT DEFAULT CURRENT_TIMESTAMP, metadata_json TEXT NOT NULL DEFAULT '{}', FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_notif_hist_empresa_fecha ON notificaciones_historial(empresa_id,fecha);
  CREATE TABLE IF NOT EXISTS recuperacion_claves(
    id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, empresa_id INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE, expira_en TEXT NOT NULL, usado INTEGER NOT NULL DEFAULT 0, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_recuperacion_token ON recuperacion_claves(token_hash,usado,expira_en);`);
  const notifEvents=[['USUARIO_CREADO','Usuario creado','Credenciales y bienvenida de usuario'],['RECUPERACION_CLAVE','Recuperación de clave','Enlace o instrucciones de recuperación'],['CAMBIO_CLAVE','Cambio de contraseña','Aviso de cambio de contraseña'],['COTIZACION_CREADA','Cotización creada','Cotización disponible para el cliente'],['COTIZACION_ACEPTADA','Cotización aceptada','Confirmación de aceptación'],['FACTURA_GENERADA','Factura generada','Factura disponible para el cliente'],['FACTURA_PROXIMA_VENCER','Factura próxima a vencer','Recordatorio de vencimiento'],['FACTURA_VENCIDA','Factura vencida','Aviso de cartera vencida'],['PAGO_REGISTRADO','Pago registrado','Confirmación de pago'],['RENOVACION_PROXIMA','Renovación próxima','Aviso de renovación'],['CONTRATO_PROXIMO_VENCER','Contrato próximo a vencer','Recordatorio contractual']];
  for(const empresa of db.prepare("SELECT id FROM empresas").all()){ for(const [codigo,nombre,descripcion] of notifEvents) db.prepare("INSERT OR IGNORE INTO notificaciones_eventos(empresa_id,codigo,nombre,descripcion) VALUES(?,?,?,?)").run(empresa.id,codigo,nombre,descripcion); const defaults={USUARIO_CREADO:["Bienvenida de usuario","Bienvenido a {{empresa}}","<p>Hola {{nombre}}, tu usuario ha sido creado correctamente.</p>"],RECUPERACION_CLAVE:["Recuperación de clave","Recuperación de acceso · {{empresa}}","<p>Hola {{nombre}}, solicita la recuperación de tu acceso desde IT GPS APP.</p>"],CAMBIO_CLAVE:["Cambio de contraseña","Tu contraseña fue actualizada · {{empresa}}","<p>Hola {{nombre}}, tu contraseña fue actualizada correctamente.</p>"],COTIZACION_CREADA:["Cotización","Cotización {{numero}} · {{empresa}}","<p>Hola {{cliente}}, adjuntamos la cotización {{numero}} por {{total}}.</p>"],COTIZACION_ACEPTADA:["Cotización aceptada","Cotización {{numero}} aceptada · {{empresa}}","<p>La cotización {{numero}} fue aceptada.</p>"],FACTURA_GENERADA:["Factura","Factura {{numero}} · {{empresa}}","<p>Hola {{cliente}}, se ha generado la factura {{numero}} por {{total}}.</p>"],FACTURA_PROXIMA_VENCER:["Recordatorio de factura","Factura {{numero}} próxima a vencer · {{empresa}}","<p>La factura {{numero}} vence el {{vencimiento}}.</p>"],FACTURA_VENCIDA:["Factura vencida","Factura {{numero}} vencida · {{empresa}}","<p>La factura {{numero}} se encuentra vencida.</p>"],PAGO_REGISTRADO:["Pago recibido","Pago registrado · {{empresa}}","<p>Hemos registrado correctamente su pago.</p>"],RENOVACION_PROXIMA:["Renovación próxima","Renovación próxima · {{empresa}}","<p>Su servicio tiene una renovación próxima.</p>"],CONTRATO_PROXIMO_VENCER:["Contrato próximo a vencer","Contrato próximo a vencer · {{empresa}}","<p>Su contrato está próximo a vencer.</p>"]}; for(const [codigo,[nombre,asunto,cuerpo]] of Object.entries(defaults)) db.prepare("INSERT INTO notificaciones_plantillas(empresa_id,evento_codigo,nombre,asunto,cuerpo_html,predeterminada,activo) SELECT ?,?,?,?,?,1,1 WHERE NOT EXISTS (SELECT 1 FROM notificaciones_plantillas WHERE empresa_id=? AND evento_codigo=? AND predeterminada=1)").run(empresa.id,codigo,nombre,asunto,cuerpo,empresa.id,codigo); }
  db.prepare(`UPDATE notificaciones_plantillas SET cuerpo_html='<p>Hola {{nombre}}, para recuperar tu acceso utiliza el siguiente enlace: <a href="{{enlace}}">Recuperar contraseña</a>.</p>',fecha_actualizacion=CURRENT_TIMESTAMP WHERE evento_codigo='RECUPERACION_CLAVE' AND predeterminada=1 AND cuerpo_html NOT LIKE '%{{enlace}}%'`).run();
  db.exec(`CREATE INDEX IF NOT EXISTS idx_notif_event_empresa ON notificaciones_eventos(empresa_id,activo);`);

  // Fase 21.1 — Centro Financiero V1. Solo agrega permisos; no recrea ni modifica datos existentes.
  const roles = ["Administrador", "Supervisor", "Comercial", "Operador", "Consulta"];
  for (const nombre of roles) db.prepare("INSERT OR IGNORE INTO roles(nombre) VALUES(?)").run(nombre);

  const modules = [["dashboard","Dashboard"],["prospectos","Prospectos"],["clientes","Clientes"],["activos","Activos"],["equipos","Equipos GPS"],["sim","Tarjetas SIM"],["m2m","Gestión M2M"],["reportes","Reportes"],["reportes_personalizados","Reportes personalizados"],["gestion","Gestión"],["configuracion","Configuración"],["usuarios","Usuarios"],["roles","Roles y permisos"],["empresas","Empresas"],["plantillas_documentos","Plantillas de documentos"],["auditoria","Auditoría"],["consolidacion","Consolidación operacional"],["operacion_gps","Operación GPS"],["servicios","Servicios"],["planes","Planes"],["suscripciones","Suscripciones"],["cotizaciones","Cotizaciones"],["facturas","Facturación"],["cartera","Cartera"],["financiero","Centro financiero"],["renovaciones","Renovaciones"],["contratos","Contratos"],["ordenes_servicio","Órdenes de servicio"],["integraciones","Integraciones GPS / M2M"]];
  const actions = [["ver","Ver"],["crear","Crear"],["editar","Editar"],["eliminar","Eliminar"],["exportar","Exportar"]];
  let nuevosPermisos = 0;
  for (const [modulo, nombre] of modules) for (const [accion, accionNombre] of actions) {
    const result = db.prepare("INSERT OR IGNORE INTO permisos(codigo,nombre,modulo,accion) VALUES(?,?,?,?)").run(`${modulo}.${accion}`, `${accionNombre} ${nombre}`, modulo, accion);
    if (result.changes) nuevosPermisos++;
  }

  const adminRole = db.prepare("SELECT id FROM roles WHERE nombre='Administrador'").get();
  for (const p of db.prepare("SELECT id FROM permisos").all()) db.prepare("INSERT OR IGNORE INTO rol_permisos(rol_id,permiso_id) VALUES(?,?)").run(adminRole.id, p.id);

  if (nuevosPermisos > 0) {
    console.log(`Migraciones de base de datos: se agregaron ${nuevosPermisos} permiso(s) nuevo(s) y se asignaron al rol Administrador.`);
  }
}
