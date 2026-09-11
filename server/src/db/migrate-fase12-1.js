import { db } from "./database.js";

const cols = db.prepare("PRAGMA table_info(equipos)").all().map(x => x.name);
const defs = [
  ["estado_operacional","TEXT NOT NULL DEFAULT 'Operativo'"],
  ["estado_conectividad","TEXT NOT NULL DEFAULT 'Sin comunicación'"],
  ["ultima_comunicacion","TEXT"],
  ["ultima_latitud","REAL"],
  ["ultima_longitud","REAL"],
  ["observaciones_operacion","TEXT NOT NULL DEFAULT ''"],
  ["fecha_actualizacion_operacion","TEXT"]
];
for (const [name, def] of defs) if (!cols.includes(name)) db.exec(`ALTER TABLE equipos ADD COLUMN ${name} ${def}`);
console.log("Migración Fase 12.1 verificada.");
