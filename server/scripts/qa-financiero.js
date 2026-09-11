import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "itgps-fin-qa-"));
const dbPath = path.join(tmpDir, "qa.db");
process.env.ITGPS_DB_PATH = dbPath;
process.env.ITGPS_TIMEZONE = "America/Bogota";

const { runMigrations } = await import("../src/db/migrate.js");
const { db } = await import("../src/db/database.js");
const { financialIntegrityReport } = await import("../src/utils/financialIntegrity.js");
const { todayISO } = await import("../src/utils/date.js");

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error: error.message }); }
}
function expectThrow(fn, messagePart) {
  assert.throws(fn, (err) => String(err.message).includes(messagePart));
}

runMigrations();

// Datos controlados de dos empresas para validar aislamiento e integridad.
db.prepare("INSERT INTO empresas(nombre,nit) VALUES(?,?)").run("QA Empresa 1", "QA1");
db.prepare("INSERT INTO empresas(nombre,nit) VALUES(?,?)").run("QA Empresa 2", "QA2");
db.prepare("INSERT INTO clientes(empresa_id,nombre,razon_social) VALUES(?,?,?)").run(1,"Cliente 1","Cliente QA 1");
db.prepare("INSERT INTO clientes(empresa_id,nombre,razon_social) VALUES(?,?,?)").run(2,"Cliente 2","Cliente QA 2");

const addInvoice = (empresa, cliente, total, vencimiento, estado="Emitida") =>
  Number(db.prepare(`INSERT INTO facturas(empresa_id,cliente_id,codigo,fecha_emision,fecha_vencimiento,estado,subtotal,total) VALUES(?,?,?,?,?,?,?,?)`)
    .run(empresa,cliente,`QA-FAC-${Date.now()}-${Math.random()}`,todayISO(),vencimiento,estado,total,total).lastInsertRowid);

const invoice1 = addInvoice(1,1,1000,"2099-12-31");

// 1. Cálculo de saldo parcial.
test("Saldo parcial 1000 - 400 = 600", () => {
  db.prepare(`INSERT INTO pagos_cartera(empresa_id,factura_id,cliente_id,fecha_pago,valor,estado) VALUES(?,?,?,?,?,?)`).run(1,invoice1,1,todayISO(),400,"Aplicado");
  const row = db.prepare(`SELECT f.total-COALESCE((SELECT SUM(valor) FROM pagos_cartera WHERE factura_id=f.id AND estado='Aplicado'),0) saldo FROM facturas f WHERE f.id=?`).get(invoice1);
  assert.equal(row.saldo, 600);
});

// 2. Pago total y saldo cero.
test("Pago total deja saldo cero", () => {
  db.prepare(`INSERT INTO pagos_cartera(empresa_id,factura_id,cliente_id,fecha_pago,valor,estado) VALUES(?,?,?,?,?,?)`).run(1,invoice1,1,todayISO(),600,"Aplicado");
  const row = db.prepare(`SELECT f.total-COALESCE((SELECT SUM(valor) FROM pagos_cartera WHERE factura_id=f.id AND estado='Aplicado'),0) saldo FROM facturas f WHERE f.id=?`).get(invoice1);
  assert.equal(row.saldo, 0);
});

// 3. Integridad factura -> cliente.
test("Bloquea factura con cliente de otra empresa", () => {
  expectThrow(() => addInvoice(1,2,500,"2099-12-31"), "Integridad financiera");
});

// 4. Integridad pago -> empresa/factura/cliente.
test("Bloquea pago con empresa incorrecta", () => {
  expectThrow(() => db.prepare(`INSERT INTO pagos_cartera(empresa_id,factura_id,cliente_id,fecha_pago,valor) VALUES(?,?,?,?,?)`).run(2,invoice1,1,todayISO(),1), "Integridad financiera");
});

test("Bloquea pago con cliente incorrecto", () => {
  expectThrow(() => db.prepare(`INSERT INTO pagos_cartera(empresa_id,factura_id,cliente_id,fecha_pago,valor) VALUES(?,?,?,?,?)`).run(1,invoice1,2,todayISO(),1), "Integridad financiera");
});

// 5. Pagos no aplicados no afectan saldo.
test("Pago no Aplicado no afecta saldo", () => {
  const invoice2 = addInvoice(1,1,750,"2099-12-31");
  db.prepare(`INSERT INTO pagos_cartera(empresa_id,factura_id,cliente_id,fecha_pago,valor,estado) VALUES(?,?,?,?,?,?)`).run(1,invoice2,1,todayISO(),200,"Anulado");
  const row = db.prepare(`SELECT f.total-COALESCE((SELECT SUM(valor) FROM pagos_cartera WHERE factura_id=f.id AND estado='Aplicado'),0) saldo FROM facturas f WHERE f.id=?`).get(invoice2);
  assert.equal(row.saldo, 750);
});

// 6. Antigüedad: factura vencida 45 días.
test("Aging 31–60 días", () => {
  const invoice3 = addInvoice(1,1,900,"2026-07-20");
  const hoy = todayISO();
  const row = db.prepare(`SELECT CASE WHEN julianday(?) - julianday(fecha_vencimiento) BETWEEN 31 AND 60 THEN '31–60 días' END bucket FROM facturas WHERE id=?`).get(hoy,invoice3);
  assert.equal(row.bucket, "31–60 días");
});

// 7. Reporte de integridad limpio.
test("Reporte de integridad limpio", () => {
  const report = financialIntegrityReport();
  assert.equal(report.ok, true);
  assert.equal(report.total_inconsistencias, 0);
});

// 8. Fecha operativa definida.
test("Zona horaria operativa Colombia", () => {
  assert.equal(process.env.ITGPS_TIMEZONE, "America/Bogota");
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});

const failed = results.filter(x => !x.ok);
console.log("\n=== IT GPS APP — QA FINANCIERO ===");
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} | ${r.name}${r.error ? ` | ${r.error}` : ""}`);
console.log(`Resultado: ${results.length - failed.length}/${results.length} pruebas OK`);

try { db.close(); } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
if (failed.length) process.exit(1);
