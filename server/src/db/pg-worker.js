import { parentPort } from 'node:worker_threads';
import pg from 'pg';

const { Client } = pg;
let client;

async function getClient() {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL es obligatorio para PostgreSQL.');
  client = new Client({
    connectionString: url,
    ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT || 30000),
  });
  await client.connect();
  return client;
}

function writeResult(sab, payload) {
  const view = new Int32Array(sab);
  const bytes = new Uint8Array(sab, 8);
  const text = JSON.stringify(payload, (_, v) => Buffer.isBuffer(v) ? {type:'Buffer',data:[...v]} : v);
  const encoded = new TextEncoder().encode(text);
  if (encoded.length > bytes.length) throw new Error('Respuesta PostgreSQL demasiado grande para el búfer.');
  bytes.fill(0);
  bytes.set(encoded);
  Atomics.store(view, 0, encoded.length);
  Atomics.store(view, 1, 1);
  Atomics.notify(view, 1);
}

parentPort.on('message', async ({ sab, sql, params }) => {
  try {
    const c = await getClient();
    const result = await c.query(sql, params || []);
    writeResult(sab, { ok:true, rows:result.rows, rowCount:result.rowCount, command:result.command, fields:(result.fields||[]).map(f=>({name:f.name,dataTypeID:f.dataTypeID})) });
  } catch (error) {
    writeResult(sab, { ok:false, error:{ message:error.message, code:error.code, detail:error.detail, constraint:error.constraint, table:error.table, column:error.column } });
  }
});
