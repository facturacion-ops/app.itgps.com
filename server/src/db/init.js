import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { db } from "./database.js";
if (process.env.DATABASE_URL) throw new Error("db:init está deshabilitado cuando DATABASE_URL apunta a PostgreSQL. No inicialice/recree la base de producción.");
const dir=path.dirname(fileURLToPath(import.meta.url));
db.exec(fs.readFileSync(path.join(dir,"schema.sql"),"utf8"));

// Migración segura para instalaciones Fase 2 anteriores.
const roleColumns=db.prepare("PRAGMA table_info(roles)").all().map(x=>x.name);
if(!roleColumns.includes("estado")) db.exec("ALTER TABLE roles ADD COLUMN estado INTEGER NOT NULL DEFAULT 1");
// Migración segura para el módulo Clientes.
const clientColumns=db.prepare("PRAGMA table_info(clientes)").all().map(x=>x.name);
const clientMigrations=[
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
  ["fecha_actualizacion", "TEXT DEFAULT ''" ]
];
for(const [name,definition] of clientMigrations) if(!clientColumns.includes(name)) db.exec(`ALTER TABLE clientes ADD COLUMN ${name} ${definition}`);

// Fase 16.1 — Clientes corporativos.
const corporateClientColumns=db.prepare("PRAGMA table_info(clientes)").all().map(x=>x.name);
const corporateClientMigrations=[
  ["razon_social","TEXT DEFAULT ''"],["nombre_comercial","TEXT DEFAULT ''"],["digito_verificacion","TEXT DEFAULT ''"],
  ["actividad_economica","TEXT DEFAULT ''"],["departamento","TEXT DEFAULT ''"],["sitio_web","TEXT DEFAULT ''"]
];
for(const [name,definition] of corporateClientMigrations) if(!corporateClientColumns.includes(name)) db.exec(`ALTER TABLE clientes ADD COLUMN ${name} ${definition}`);
db.exec(`CREATE TABLE IF NOT EXISTS cliente_contactos(
 id INTEGER PRIMARY KEY AUTOINCREMENT,cliente_id INTEGER NOT NULL,nombre TEXT NOT NULL,cargo TEXT DEFAULT '',
 tipo_contacto TEXT NOT NULL DEFAULT 'Comercial',telefono TEXT DEFAULT '',celular TEXT DEFAULT '',correo TEXT DEFAULT '',
 principal INTEGER NOT NULL DEFAULT 0,estado INTEGER NOT NULL DEFAULT 1,observaciones TEXT DEFAULT '',creado_por INTEGER,
 fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,FOREIGN KEY(creado_por) REFERENCES usuarios(id)
);`);
db.exec("CREATE INDEX IF NOT EXISTS idx_cliente_contactos_cliente ON cliente_contactos(cliente_id)");
const prospectColumns=db.prepare("PRAGMA table_info(prospectos)").all().map(x=>x.name); const prospectMigrations=[["codigo","TEXT NOT NULL DEFAULT ''"],["tipo_prospecto","TEXT NOT NULL DEFAULT 'Empresa'"],["nit","TEXT DEFAULT ''"],["contacto","TEXT DEFAULT ''"],["telefono","TEXT DEFAULT ''"],["correo","TEXT DEFAULT ''"],["ciudad","TEXT DEFAULT ''"],["direccion","TEXT DEFAULT ''"],["origen","TEXT DEFAULT 'Otro'"],["etapa","TEXT NOT NULL DEFAULT 'Nuevo'"],["estado","INTEGER NOT NULL DEFAULT 1"],["responsable_id","INTEGER"],["proxima_gestion","TEXT DEFAULT ''"],["observaciones","TEXT DEFAULT ''"],["convertido_cliente_id","INTEGER"],["creado_por","INTEGER"],["fecha_creacion","TEXT DEFAULT ''"],["fecha_actualizacion","TEXT DEFAULT ''"]]; for(const [name,definition] of prospectMigrations) if(!prospectColumns.includes(name)) db.exec(`ALTER TABLE prospectos ADD COLUMN ${name} ${definition}`);
const assetColumns=db.prepare("PRAGMA table_info(activos)").all().map(x=>x.name);
const assetMigrations=[
["empresa_id","INTEGER"],["cliente_id","INTEGER"],["codigo","TEXT NOT NULL DEFAULT ''"],["placa","TEXT DEFAULT ''"],["tipo_activo","TEXT NOT NULL DEFAULT 'Vehículo'"],["marca","TEXT DEFAULT ''"],["linea","TEXT DEFAULT ''"],["modelo","TEXT DEFAULT ''"],["anio","INTEGER"],["color","TEXT DEFAULT ''"],["vin","TEXT DEFAULT ''"],["numero_motor","TEXT DEFAULT ''"],["estado","TEXT NOT NULL DEFAULT 'Activo'"],["fecha_alta","TEXT DEFAULT ''"],["fecha_baja","TEXT DEFAULT ''"],["observaciones","TEXT DEFAULT ''"],["creado_por","INTEGER"],["fecha_creacion","TEXT DEFAULT ''"],["fecha_actualizacion","TEXT DEFAULT ''"]];
for(const [name,definition] of assetMigrations) if(!assetColumns.includes(name)) db.exec(`ALTER TABLE activos ADD COLUMN ${name} ${definition}`);

// Fase 8 — Equipos GPS.
// La tabla puede existir desde una versión anterior. CREATE TABLE IF NOT EXISTS
// no agrega columnas a una tabla existente, por eso primero hacemos una migración
// columna por columna y solamente después creamos los índices.
const equipmentColumns=db.prepare("PRAGMA table_info(equipos)").all().map(x=>x.name);
const equipmentMigrations=[
  ["empresa_id","INTEGER"],
  ["activo_id","INTEGER"],
  ["codigo","TEXT NOT NULL DEFAULT ''"],
  ["imei","TEXT NOT NULL DEFAULT ''"],
  ["numero_serie","TEXT DEFAULT ''"],
  ["fabricante","TEXT DEFAULT ''"],
  ["marca","TEXT DEFAULT ''"],
  ["modelo","TEXT DEFAULT ''"],
  ["tipo_dispositivo","TEXT DEFAULT ''"],
  ["estado","TEXT NOT NULL DEFAULT 'Disponible'"],
  ["firmware","TEXT DEFAULT ''"],
  ["protocolo","TEXT DEFAULT ''"],
  ["fecha_compra","TEXT DEFAULT ''"],
  ["fecha_instalacion","TEXT DEFAULT ''"],
  ["fecha_garantia","TEXT DEFAULT ''"],
  ["observaciones","TEXT DEFAULT ''"],
  ["creado_por","INTEGER"],
  ["fecha_creacion","TEXT DEFAULT ''"],
  ["fecha_actualizacion","TEXT DEFAULT ''"]
];
for(const [name,definition] of equipmentMigrations){
  if(!equipmentColumns.includes(name)){
    db.exec(`ALTER TABLE equipos ADD COLUMN ${name} ${definition}`);
  }
}
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS uq_equipos_imei ON equipos(imei) WHERE imei <> ''");
db.exec("CREATE INDEX IF NOT EXISTS idx_equipos_empresa ON equipos(empresa_id)");
db.exec("CREATE INDEX IF NOT EXISTS idx_equipos_activo ON equipos(activo_id)");

// Fase 9 — Tarjetas SIM / M2M.
const simColumns=db.prepare("PRAGMA table_info(sim_cards)").all().map(x=>x.name);
const simMigrations=[["equipo_id","INTEGER"],["imsi","TEXT DEFAULT ''"],["numero","TEXT DEFAULT ''"],["operador","TEXT DEFAULT ''"],["plan_m2m","TEXT DEFAULT ''"],["apn","TEXT DEFAULT ''"],["usuario_apn","TEXT DEFAULT ''"],["clave_apn","TEXT DEFAULT ''"],["estado","TEXT NOT NULL DEFAULT 'En inventario'"],["fecha_activacion","TEXT DEFAULT ''"],["fecha_suspension","TEXT DEFAULT ''"],["fecha_baja","TEXT DEFAULT ''"],["observaciones","TEXT DEFAULT ''"],["creado_por","INTEGER"],["fecha_creacion","TEXT DEFAULT ''"],["fecha_actualizacion","TEXT DEFAULT ''"]];
for(const [name,definition] of simMigrations){if(!simColumns.includes(name))db.exec(`ALTER TABLE sim_cards ADD COLUMN ${name} ${definition}`);}
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS uq_sim_iccid ON sim_cards(iccid) WHERE iccid <> ''");
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS uq_sim_imsi ON sim_cards(imsi) WHERE imsi <> ''");
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS uq_sim_equipo_activo ON sim_cards(equipo_id) WHERE equipo_id IS NOT NULL AND estado <> 'Baja'");
db.exec("CREATE INDEX IF NOT EXISTS idx_sim_empresa ON sim_cards(empresa_id)");
db.exec("CREATE INDEX IF NOT EXISTS idx_sim_equipo ON sim_cards(equipo_id)");
// Fase 10 — Gestión M2M: planes, consumos, alertas e historial.
const simM2mColumns=db.prepare("PRAGMA table_info(sim_cards)").all().map(x=>x.name);
for(const [name,definition] of [["plan_id","INTEGER"],["fecha_corte","INTEGER"]]) if(!simM2mColumns.includes(name)) db.exec(`ALTER TABLE sim_cards ADD COLUMN ${name} ${definition}`);
db.exec(`CREATE TABLE IF NOT EXISTS m2m_planes(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 empresa_id INTEGER NOT NULL,
 nombre TEXT NOT NULL,
 operador TEXT DEFAULT '',
 descripcion TEXT DEFAULT '',
 mb_incluidos REAL NOT NULL DEFAULT 0,
 costo_mensual REAL NOT NULL DEFAULT 0,
 dia_corte INTEGER NOT NULL DEFAULT 1,
 alerta_80 REAL NOT NULL DEFAULT 80,
 alerta_100 REAL NOT NULL DEFAULT 100,
 estado INTEGER NOT NULL DEFAULT 1,
 creado_por INTEGER,
 fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
 fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(empresa_id) REFERENCES empresas(id),
 FOREIGN KEY(creado_por) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS m2m_consumos(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 sim_id INTEGER NOT NULL,
 periodo TEXT NOT NULL,
 mb_consumidos REAL NOT NULL DEFAULT 0,
 fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(sim_id,periodo),
 FOREIGN KEY(sim_id) REFERENCES sim_cards(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS m2m_alertas(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 empresa_id INTEGER NOT NULL,
 sim_id INTEGER NOT NULL,
 tipo TEXT NOT NULL,
 periodo TEXT NOT NULL,
 umbral REAL NOT NULL DEFAULT 0,
 mensaje TEXT NOT NULL,
 estado TEXT NOT NULL DEFAULT 'ABIERTA',
 fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
 fecha_atencion TEXT,
 atendida_por INTEGER,
 FOREIGN KEY(empresa_id) REFERENCES empresas(id),
 FOREIGN KEY(sim_id) REFERENCES sim_cards(id),
 FOREIGN KEY(atendida_por) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS m2m_historial_estados(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 empresa_id INTEGER NOT NULL,
 sim_id INTEGER NOT NULL,
 estado_anterior TEXT,
 estado_nuevo TEXT NOT NULL,
 motivo TEXT DEFAULT '',
 usuario_id INTEGER,
 fecha TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(empresa_id) REFERENCES empresas(id),
 FOREIGN KEY(sim_id) REFERENCES sim_cards(id),
 FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS idx_m2m_planes_empresa ON m2m_planes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_m2m_consumos_periodo ON m2m_consumos(periodo);
CREATE INDEX IF NOT EXISTS idx_m2m_alertas_empresa_estado ON m2m_alertas(empresa_id,estado);
CREATE INDEX IF NOT EXISTS idx_m2m_historial_empresa_fecha ON m2m_historial_estados(empresa_id,fecha);`);

const permissionColumns=db.prepare("PRAGMA table_info(permisos)").all().map(x=>x.name);
if(!permissionColumns.includes("modulo")) db.exec("ALTER TABLE permisos ADD COLUMN modulo TEXT NOT NULL DEFAULT ''");
if(!permissionColumns.includes("accion")) db.exec("ALTER TABLE permisos ADD COLUMN accion TEXT NOT NULL DEFAULT ''");
let empresa=db.prepare("SELECT id FROM empresas ORDER BY id LIMIT 1").get();
if(!empresa){const x=db.prepare("INSERT INTO empresas(nombre,nit) VALUES(?,?)").run("IT GPS","900000000-0");empresa={id:Number(x.lastInsertRowid)};}
const roles=["Administrador","Supervisor","Comercial","Operador","Consulta"];
for(const nombre of roles) db.prepare("INSERT OR IGNORE INTO roles(nombre) VALUES(?)").run(nombre);
const modules=[
["dashboard","Dashboard"],["prospectos","Prospectos"],["clientes","Clientes"],["activos","Activos"],["equipos","Equipos GPS"],["sim","Tarjetas SIM"],["m2m","Gestión M2M"],["reportes","Reportes"],["gestion","Gestión"],["configuracion","Configuración"],["usuarios","Usuarios"],["roles","Roles y permisos"],["empresas","Empresas"],["auditoria","Auditoría"],["consolidacion","Consolidación operacional"]];
const actions=[["ver","Ver"],["crear","Crear"],["editar","Editar"],["eliminar","Eliminar"],["exportar","Exportar"]];
for(const [modulo,nombre] of modules) for(const [accion,accionNombre] of actions) db.prepare("INSERT OR IGNORE INTO permisos(codigo,nombre,modulo,accion) VALUES(?,?,?,?)").run(`${modulo}.${accion}`,`${accionNombre} ${nombre}`,modulo,accion);
const adminRole=db.prepare("SELECT id FROM roles WHERE nombre='Administrador'").get();
for(const p of db.prepare("SELECT id FROM permisos").all()) db.prepare("INSERT OR IGNORE INTO rol_permisos(rol_id,permiso_id) VALUES(?,?)").run(adminRole.id,p.id);
let u=db.prepare("SELECT id FROM usuarios WHERE empresa_id=? AND lower(correo)=lower(?)").get(empresa.id,"admin@itgps.com");
if(!u){db.prepare("INSERT INTO usuarios(empresa_id,rol_id,nombre,apellido,correo,password_hash) VALUES(?,?,?,?,?,?)").run(empresa.id,adminRole.id,"Administrador","IT GPS","admin@itgps.com",bcrypt.hashSync("Cambiar123!",12));}
else db.prepare("UPDATE usuarios SET empresa_id=?,rol_id=?,estado=1 WHERE id=?").run(empresa.id,adminRole.id,u.id);
console.log("Base de datos inicializada correctamente."); console.log("Usuario: admin@itgps.com"); console.log("Contraseña: Cambiar123!"); db.close();
