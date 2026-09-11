#!/usr/bin/env node
/*
 * One-time migration: existing IT GPS APP SQLite -> Render PostgreSQL.
 * Usage:
 *   DATABASE_URL="<Render External Database URL>" node server/scripts/migrate-sqlite-to-postgres.cjs
 * The SQLite source defaults to server/data/itgps.db and is never modified.
 */
const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('better-sqlite3');
const { Client } = require('pg');

const root = path.resolve(__dirname, '..');
const sqlitePath = process.env.ITGPS_SQLITE_PATH || path.join(root, 'data', 'itgps.db');
const schemaPath = path.join(root, 'src', 'db', 'schema.postgres.sql');
const url = process.env.DATABASE_URL;
if (!url) { console.error('ERROR: falta DATABASE_URL'); process.exit(1); }
if (!fs.existsSync(sqlitePath)) { console.error(`ERROR: no existe ${sqlitePath}`); process.exit(1); }

function topo(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(x=>x.name);
  const deps = Object.fromEntries(tables.map(t=>[t,new Set()]));
  for (const t of tables) for (const f of db.prepare(`PRAGMA foreign_key_list("${t}")`).all()) deps[t].add(f.table);
  const indeg = Object.fromEntries(tables.map(t=>[t,deps[t].size]));
  const order=[];
  while(order.length<tables.length){
    const ready=tables.filter(t=>indeg[t]===0 && !order.includes(t)).sort();
    if(!ready.length) throw new Error('No se pudo ordenar las tablas por FK.');
    for(const t of ready){ order.push(t); for(const child of tables) if(deps[child].has(t)) indeg[child]--; }
  }
  return order;
}
function qident(s){ return '"'+String(s).replaceAll('"','""')+'"'; }

(async()=>{
  const src = new sqlite3(sqlitePath, { readonly:true, fileMustExist:true });
  const client = new Client({connectionString:url, ssl:{rejectUnauthorized:false}});
  await client.connect();
  try {
    console.log(`SQLite: ${sqlitePath}`);
    await client.query('BEGIN');
    await client.query(fs.readFileSync(schemaPath,'utf8'));
    const order=topo(src);
    for(const table of order){
      const cols=src.prepare(`PRAGMA table_info(${qident(table)})`).all().map(x=>x.name);
      const rows=src.prepare(`SELECT * FROM ${qident(table)}`).all();
      if(!rows.length){ console.log(`OK ${table}: 0`); continue; }
      const names=cols.map(qident).join(',');
      const params=cols.map((_,i)=>`$${i+1}`).join(',');
      const sql=`INSERT INTO ${qident(table)} (${names}) VALUES (${params}) ON CONFLICT DO NOTHING`;
      for(const row of rows) await client.query(sql,cols.map(c=>row[c]));
      console.log(`OK ${table}: ${rows.length}`);
    }
    for(const table of order){
      const id=src.prepare(`PRAGMA table_info(${qident(table)})`).all().find(x=>x.pk===1 && x.name==='id');
      if(!id) continue;
      const max=src.prepare(`SELECT MAX(id) n FROM ${qident(table)}`).get().n;
      if(max==null) continue;
      const seq=await client.query(`SELECT pg_get_serial_sequence($1,$2) AS seq`,[table,'id']);
      if(seq.rows[0].seq) await client.query(`SELECT setval($1::regclass,$2,true)`,[seq.rows[0].seq,Number(max)]);
    }
    await client.query('COMMIT');
    console.log('MIGRACION COMPLETADA');
  } catch(e){
    await client.query('ROLLBACK').catch(()=>{});
    console.error('MIGRACION FALLIDA:',e.message);
    process.exitCode=1;
  } finally { src.close(); await client.end(); }
})();
