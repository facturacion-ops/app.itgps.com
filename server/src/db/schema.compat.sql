CREATE TABLE activos(
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
CREATE TABLE auditoria(
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
CREATE TABLE cliente_contactos(id INTEGER PRIMARY KEY AUTOINCREMENT,cliente_id INTEGER NOT NULL,nombre TEXT NOT NULL,cargo TEXT DEFAULT '',tipo_contacto TEXT NOT NULL DEFAULT 'Comercial',telefono TEXT DEFAULT '',celular TEXT DEFAULT '',correo TEXT DEFAULT '',principal INTEGER NOT NULL DEFAULT 0,estado INTEGER NOT NULL DEFAULT 1,observaciones TEXT DEFAULT '',creado_por INTEGER,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,FOREIGN KEY(creado_por) REFERENCES usuarios(id));
CREATE TABLE clientes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL,
  codigo TEXT NOT NULL DEFAULT '',
  nombre TEXT NOT NULL,
  nit TEXT DEFAULT '',
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
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, razon_social TEXT DEFAULT '', nombre_comercial TEXT DEFAULT '', digito_verificacion TEXT DEFAULT '', actividad_economica TEXT DEFAULT '', departamento TEXT DEFAULT '', sitio_web TEXT DEFAULT '',
  FOREIGN KEY(empresa_id) REFERENCES empresas(id),
  FOREIGN KEY(creado_por) REFERENCES usuarios(id)
);
CREATE TABLE configuracion_empresa(
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
CREATE TABLE contratos(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, cotizacion_id INTEGER, suscripcion_id INTEGER,
    codigo TEXT NOT NULL DEFAULT '', titulo TEXT NOT NULL DEFAULT '', fecha_inicio TEXT NOT NULL, fecha_fin TEXT DEFAULT '', estado TEXT NOT NULL DEFAULT 'Borrador',
    valor REAL NOT NULL DEFAULT 0, observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(cotizacion_id) REFERENCES cotizaciones(id), FOREIGN KEY(suscripcion_id) REFERENCES suscripciones(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id));
CREATE TABLE cotizacion_detalles(
    id INTEGER PRIMARY KEY AUTOINCREMENT, cotizacion_id INTEGER NOT NULL, servicio_id INTEGER, plan_id INTEGER, descripcion TEXT DEFAULT '',
    cantidad REAL NOT NULL DEFAULT 1, precio_unitario REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL DEFAULT 0, orden INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE, FOREIGN KEY(servicio_id) REFERENCES servicios(id), FOREIGN KEY(plan_id) REFERENCES planes(id)
  );
CREATE TABLE "cotizaciones"(
        id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER, prospecto_id INTEGER REFERENCES prospectos(id), codigo TEXT NOT NULL DEFAULT '',
        fecha TEXT NOT NULL, vigencia_dias INTEGER NOT NULL DEFAULT 15, fecha_vencimiento TEXT DEFAULT '', responsable_id INTEGER,
        estado TEXT NOT NULL DEFAULT 'Borrador', subtotal REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, impuestos REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
        condiciones TEXT DEFAULT '', observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(responsable_id) REFERENCES usuarios(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
      );
CREATE TABLE empresa_marca(
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
CREATE TABLE empresas(id INTEGER PRIMARY KEY AUTOINCREMENT,nombre TEXT NOT NULL,nit TEXT,estado INTEGER NOT NULL DEFAULT 1,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE equipos(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,imei TEXT NOT NULL, activo_id INTEGER, codigo TEXT NOT NULL DEFAULT '', numero_serie TEXT DEFAULT '', fabricante TEXT DEFAULT '', marca TEXT DEFAULT '', modelo TEXT DEFAULT '', tipo_dispositivo TEXT DEFAULT '', estado TEXT NOT NULL DEFAULT 'Disponible', firmware TEXT DEFAULT '', protocolo TEXT DEFAULT '', fecha_compra TEXT DEFAULT '', fecha_instalacion TEXT DEFAULT '', fecha_garantia TEXT DEFAULT '', observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT '', fecha_actualizacion TEXT DEFAULT '', estado_operacional TEXT NOT NULL DEFAULT 'Operativo', estado_conectividad TEXT NOT NULL DEFAULT 'Sin comunicación', ultima_comunicacion TEXT, ultima_latitud REAL, ultima_longitud REAL, observaciones_operacion TEXT NOT NULL DEFAULT '', fecha_actualizacion_operacion TEXT);
CREATE TABLE factura_detalles(
    id INTEGER PRIMARY KEY AUTOINCREMENT, factura_id INTEGER NOT NULL, servicio_id INTEGER, plan_id INTEGER, descripcion TEXT DEFAULT '',
    cantidad REAL NOT NULL DEFAULT 1, precio_unitario REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, subtotal REAL NOT NULL DEFAULT 0, orden INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(factura_id) REFERENCES facturas(id) ON DELETE CASCADE, FOREIGN KEY(servicio_id) REFERENCES servicios(id), FOREIGN KEY(plan_id) REFERENCES planes(id)
  );
CREATE TABLE facturacion_config(
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
CREATE TABLE facturacion_lote_detalles(
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
CREATE TABLE facturacion_lotes(
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
CREATE TABLE facturacion_periodos(
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
CREATE TABLE facturas(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, cotizacion_id INTEGER,
    codigo TEXT NOT NULL DEFAULT '', fecha_emision TEXT NOT NULL, fecha_vencimiento TEXT DEFAULT '', estado TEXT NOT NULL DEFAULT 'Borrador',
    subtotal REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, impuestos REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
    observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, suscripcion_id INTEGER, periodo_facturacion TEXT DEFAULT '',
    FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(cotizacion_id) REFERENCES cotizaciones(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
CREATE TABLE gestion_tareas(
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
CREATE TABLE gps_integracion_eventos(
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
CREATE TABLE integracion_logs(
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
CREATE TABLE integracion_mapeos(
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
CREATE TABLE integraciones(
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
CREATE TABLE m2m_alertas(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,sim_id INTEGER NOT NULL,tipo TEXT NOT NULL,periodo TEXT NOT NULL,umbral REAL NOT NULL DEFAULT 0,mensaje TEXT NOT NULL,estado TEXT NOT NULL DEFAULT 'ABIERTA',fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_atencion TEXT,atendida_por INTEGER,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(sim_id) REFERENCES sim_cards(id),FOREIGN KEY(atendida_por) REFERENCES usuarios(id));
CREATE TABLE m2m_consumos(id INTEGER PRIMARY KEY AUTOINCREMENT,sim_id INTEGER NOT NULL,periodo TEXT NOT NULL,mb_consumidos REAL NOT NULL DEFAULT 0,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(sim_id,periodo),FOREIGN KEY(sim_id) REFERENCES sim_cards(id) ON DELETE CASCADE);
CREATE TABLE m2m_historial_estados(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,sim_id INTEGER NOT NULL,estado_anterior TEXT,estado_nuevo TEXT NOT NULL,motivo TEXT DEFAULT '',usuario_id INTEGER,fecha TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(sim_id) REFERENCES sim_cards(id),FOREIGN KEY(usuario_id) REFERENCES usuarios(id));
CREATE TABLE m2m_planes(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,nombre TEXT NOT NULL,operador TEXT DEFAULT '',descripcion TEXT DEFAULT '',mb_incluidos REAL NOT NULL DEFAULT 0,costo_mensual REAL NOT NULL DEFAULT 0,dia_corte INTEGER NOT NULL DEFAULT 1,alerta_80 REAL NOT NULL DEFAULT 80,alerta_100 REAL NOT NULL DEFAULT 100,estado INTEGER NOT NULL DEFAULT 1,creado_por INTEGER,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(creado_por) REFERENCES usuarios(id));
CREATE TABLE notificaciones_email(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER,usuario_id INTEGER,destinatario TEXT NOT NULL,asunto TEXT NOT NULL,cuerpo TEXT NOT NULL,estado TEXT DEFAULT 'PENDIENTE');
CREATE TABLE notificaciones_eventos(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, codigo TEXT NOT NULL, nombre TEXT NOT NULL, descripcion TEXT NOT NULL DEFAULT '', activo INTEGER NOT NULL DEFAULT 1, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(empresa_id,codigo), FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
CREATE TABLE notificaciones_historial(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, evento_codigo TEXT NOT NULL, destinatario TEXT NOT NULL, asunto TEXT NOT NULL DEFAULT '', estado TEXT NOT NULL, mensaje_error TEXT NOT NULL DEFAULT '', fecha TEXT DEFAULT CURRENT_TIMESTAMP, metadata_json TEXT NOT NULL DEFAULT '{}', FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
CREATE TABLE notificaciones_plantillas(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, evento_codigo TEXT NOT NULL, nombre TEXT NOT NULL, asunto TEXT NOT NULL, cuerpo_html TEXT NOT NULL, predeterminada INTEGER NOT NULL DEFAULT 0, activo INTEGER NOT NULL DEFAULT 1, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
CREATE TABLE notificaciones_smtp(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL UNIQUE, smtp_host TEXT NOT NULL DEFAULT '', smtp_port INTEGER NOT NULL DEFAULT 587, smtp_secure TEXT NOT NULL DEFAULT 'starttls', smtp_usuario TEXT NOT NULL DEFAULT '', smtp_password_enc TEXT NOT NULL DEFAULT '', smtp_rechazar_certificado INTEGER NOT NULL DEFAULT 1, remitente_email TEXT NOT NULL DEFAULT '', remitente_nombre TEXT NOT NULL DEFAULT '', reply_to TEXT NOT NULL DEFAULT '', activo INTEGER NOT NULL DEFAULT 0, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
CREATE TABLE ordenes_servicio(
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
CREATE TABLE pagos_cartera(
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
CREATE TABLE permisos(id INTEGER PRIMARY KEY AUTOINCREMENT,codigo TEXT NOT NULL UNIQUE,nombre TEXT NOT NULL,modulo TEXT NOT NULL,accion TEXT NOT NULL);
CREATE TABLE planes(
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
CREATE TABLE plantillas_documentos(
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
CREATE TABLE prospectos(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,codigo TEXT NOT NULL DEFAULT '',nombre TEXT NOT NULL,tipo_prospecto TEXT NOT NULL DEFAULT 'Empresa',nit TEXT DEFAULT '',contacto TEXT DEFAULT '',telefono TEXT DEFAULT '',correo TEXT DEFAULT '',ciudad TEXT DEFAULT '',direccion TEXT DEFAULT '',origen TEXT DEFAULT 'Otro',etapa TEXT NOT NULL DEFAULT 'Nuevo',estado INTEGER NOT NULL DEFAULT 1,responsable_id INTEGER,proxima_gestion TEXT DEFAULT '',observaciones TEXT DEFAULT '',convertido_cliente_id INTEGER,creado_por INTEGER,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(responsable_id) REFERENCES usuarios(id),FOREIGN KEY(creado_por) REFERENCES usuarios(id),FOREIGN KEY(convertido_cliente_id) REFERENCES clientes(id));
CREATE TABLE push_suscripciones(id INTEGER PRIMARY KEY AUTOINCREMENT,usuario_id INTEGER NOT NULL,endpoint TEXT UNIQUE NOT NULL,p256dh TEXT NOT NULL,auth TEXT NOT NULL);
CREATE TABLE recuperacion_claves(
    id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, empresa_id INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE, expira_en TEXT NOT NULL, usado INTEGER NOT NULL DEFAULT 0, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
  );
CREATE TABLE recuperacion_password(id INTEGER PRIMARY KEY AUTOINCREMENT,usuario_id INTEGER NOT NULL,token_hash TEXT UNIQUE NOT NULL,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_expira TEXT NOT NULL,fecha_uso TEXT,FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE);
CREATE TABLE renovaciones(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, suscripcion_id INTEGER NOT NULL, plan_id INTEGER NOT NULL,
    codigo TEXT NOT NULL DEFAULT '', factura_id INTEGER, fecha_renovacion TEXT NOT NULL, fecha_anterior_fin TEXT DEFAULT '', nueva_fecha_inicio TEXT NOT NULL, nueva_fecha_fin TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1, precio REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'Procesada', observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(suscripcion_id) REFERENCES suscripciones(id), FOREIGN KEY(plan_id) REFERENCES planes(id), FOREIGN KEY(factura_id) REFERENCES facturas(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
CREATE TABLE reportes_personalizados(
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
CREATE TABLE rol_permisos(rol_id INTEGER NOT NULL,permiso_id INTEGER NOT NULL,PRIMARY KEY(rol_id,permiso_id),FOREIGN KEY(rol_id) REFERENCES roles(id) ON DELETE CASCADE,FOREIGN KEY(permiso_id) REFERENCES permisos(id) ON DELETE CASCADE);
CREATE TABLE roles(id INTEGER PRIMARY KEY AUTOINCREMENT,nombre TEXT NOT NULL UNIQUE,estado INTEGER NOT NULL DEFAULT 1,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE seguridad_login_intentos(
    id INTEGER PRIMARY KEY AUTOINCREMENT, correo TEXT NOT NULL, ip TEXT NOT NULL DEFAULT '', fallos INTEGER NOT NULL DEFAULT 0, bloqueado_hasta TEXT, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(correo,ip)
  );
CREATE TABLE servicios(
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
CREATE TABLE sesiones(id INTEGER PRIMARY KEY AUTOINCREMENT,usuario_id INTEGER NOT NULL,token_jti TEXT UNIQUE NOT NULL,fecha_inicio TEXT DEFAULT CURRENT_TIMESTAMP,fecha_expira TEXT NOT NULL,fecha_cierre TEXT,ip TEXT,user_agent TEXT,FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE);
CREATE TABLE sim_cards(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,iccid TEXT NOT NULL, equipo_id INTEGER, imsi TEXT DEFAULT '', numero TEXT DEFAULT '', operador TEXT DEFAULT '', plan_m2m TEXT DEFAULT '', apn TEXT DEFAULT '', usuario_apn TEXT DEFAULT '', clave_apn TEXT DEFAULT '', estado TEXT NOT NULL DEFAULT 'En inventario', fecha_activacion TEXT DEFAULT '', fecha_suspension TEXT DEFAULT '', fecha_baja TEXT DEFAULT '', observaciones TEXT DEFAULT '', creado_por INTEGER, fecha_creacion TEXT DEFAULT '', fecha_actualizacion TEXT DEFAULT '', plan_id INTEGER, fecha_corte INTEGER);
CREATE TABLE suscripciones(
    id INTEGER PRIMARY KEY AUTOINCREMENT, empresa_id INTEGER NOT NULL, cliente_id INTEGER NOT NULL, plan_id INTEGER NOT NULL,
    codigo TEXT NOT NULL DEFAULT '', fecha_inicio TEXT NOT NULL, fecha_fin TEXT DEFAULT '', cantidad INTEGER NOT NULL DEFAULT 1,
    precio REAL NOT NULL DEFAULT 0, descuento REAL NOT NULL DEFAULT 0, dia_facturacion INTEGER NOT NULL DEFAULT 1,
    renovacion_automatica INTEGER NOT NULL DEFAULT 0, estado TEXT NOT NULL DEFAULT 'Activa', observaciones TEXT DEFAULT '',
    creado_por INTEGER, fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP, fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(empresa_id) REFERENCES empresas(id), FOREIGN KEY(cliente_id) REFERENCES clientes(id), FOREIGN KEY(plan_id) REFERENCES planes(id), FOREIGN KEY(creado_por) REFERENCES usuarios(id)
  );
CREATE TABLE usuarios(id INTEGER PRIMARY KEY AUTOINCREMENT,empresa_id INTEGER NOT NULL,rol_id INTEGER NOT NULL,nombre TEXT NOT NULL,apellido TEXT,password_hash TEXT NOT NULL,correo TEXT NOT NULL,estado INTEGER DEFAULT 1,ultimo_login TEXT,fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(empresa_id,correo),FOREIGN KEY(empresa_id) REFERENCES empresas(id),FOREIGN KEY(rol_id) REFERENCES roles(id));
