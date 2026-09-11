import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import Database from 'better-sqlite3';

const here = path.dirname(fileURLToPath(import.meta.url));
const usePostgres = Boolean(process.env.DATABASE_URL);
const sqlitePath = path.join(here, '../../data/itgps.db');
const sqliteDb = usePostgres ? null : new Database(sqlitePath);
if (sqliteDb) sqliteDb.pragma('foreign_keys = ON');
let worker = null;
let initialized = false;
let inTransaction = false;

function quoteIdent(v){ return `"${String(v).replaceAll('"','""')}"`; }

function replacePlaceholders(sql){
  let out=''; let n=0; let quote=null;
  for(let i=0;i<sql.length;i++){
    const ch=sql[i];
    if(quote){
      out+=ch;
      if(ch===quote){
        if(sql[i+1]===quote){out+=sql[++i];} else quote=null;
      }
      continue;
    }
    if(ch==='\'' || ch==='"' || ch==='`'){ quote=ch; out+=ch; continue; }
    if(ch==='?'){ out+=`$${++n}`; continue; }
    out+=ch;
  }
  return out;
}

function translateSql(input){
  let sql=String(input).trim();
  sql=sql.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi,'INSERT INTO');
  if(/^INSERT\s+INTO[\s\S]*?;?$/i.test(sql) && /INSERT\s+INTO/i.test(sql) && !/ON\s+CONFLICT/i.test(sql)){
    // PostgreSQL accepts a conflict-free insert only if the statement is followed by this clause.
    // For normal inserts this is harmless and matches SQLite's OR IGNORE behavior used by the app.
    if(/INSERT\s+OR\s+IGNORE/i.test(input)) sql += ' ON CONFLICT DO NOTHING';
  }
  sql=replacePlaceholders(sql);

  // SQLite date/time compatibility used by the existing routes.
  sql=sql.replace(/strftime\(\s*'%Y-%m'\s*,\s*'now'\s*\)/gi,"TO_CHAR(CURRENT_DATE,'YYYY-MM')");
  sql=sql.replace(/datetime\(\s*'now'\s*,\s*'([^']+)'\s*\)/gi,(_,v)=>`(CURRENT_TIMESTAMP + INTERVAL '${v}')`);
  sql=sql.replace(/datetime\(\s*'now'\s*\)/gi,'CURRENT_TIMESTAMP');
  sql=sql.replace(/datetime\(\s*([^,()]+?)\s*\)/gi,"(NULLIF($1,'')::timestamp)");
  sql=sql.replace(/date\(\s*'now'\s*,\s*'start of month'\s*\)/gi,"date_trunc('month',CURRENT_DATE)::date");
  sql=sql.replace(/date\(\s*'now'\s*,\s*(\$\d+)\s*\)/gi,'(CURRENT_DATE + ($1)::interval)::date');
  sql=sql.replace(/date\(\s*'now'\s*,\s*'([^']+)'\s*\)/gi,(_,v)=>`(CURRENT_DATE + INTERVAL '${v}')::date`);
  sql=sql.replace(/date\(\s*'now'\s*\)/gi,'CURRENT_DATE');
  sql=sql.replace(/date\(\s*(\$\d+)\s*\)/gi,'($1::date)');
  sql=sql.replace(/date\(\s*([A-Za-z_][\w.]*)\s*\)/gi,"(NULLIF($1,'')::date)");
  sql=sql.replace(/date_trunc\(\s*'month'\s*,\s*CURRENT_DATE\s*\)/gi,"date_trunc('month',CURRENT_DATE)");
  return sql;
}

function ensureWorker(){
  if(!worker) worker=new Worker(new URL('./pg-worker.js', import.meta.url), {env:process.env});
  return worker;
}

function callWorker(sql, params=[]){
  const sab=new SharedArrayBuffer(8 + 4*1024*1024);
  const state=new Int32Array(sab,0,2);
  ensureWorker().postMessage({sab,sql,params});
  while(Atomics.load(state,1)===0) Atomics.wait(state,1,0);
  const len=Atomics.load(state,0);
  const text=new TextDecoder().decode(new Uint8Array(sab,8,len));
  const result=JSON.parse(text);
  if(!result.ok){
    const e=new Error(result.error?.message||'Error PostgreSQL');
    Object.assign(e,result.error||{});
    throw e;
  }
  return result;
}

function paramsFromArgs(args){
  if(args.length===1 && Array.isArray(args[0])) return args[0];
  return args;
}

function prepare(sql){
  const pgSql=translateSql(sql);
  return {
    get(...args){ return callWorker(pgSql,paramsFromArgs(args)).rows[0]; },
    all(...args){ return callWorker(pgSql,paramsFromArgs(args)).rows; },
    iterate(...args){ return callWorker(pgSql,paramsFromArgs(args)).rows.values(); },
    run(...args){
      const result=callWorker(pgSql,paramsFromArgs(args));
      let lastInsertRowid=0;
      if(String(result.command).toUpperCase()==='INSERT'){
        const m=/^INSERT\s+INTO\s+(["A-Za-z_][\w".]*)/i.exec(pgSql);
        if(m){
          const table=m[1].replaceAll('"','');
          try{
            const seq=callWorker(`SELECT pg_get_serial_sequence($1,'id') AS seq`,[table]).rows[0]?.seq;
            if(seq) lastInsertRowid=Number(callWorker(`SELECT currval($1::regclass) AS id`,[seq]).rows[0]?.id||0);
          }catch{}
        }
      }
      return {changes:Number(result.rowCount||0),lastInsertRowid};
    },
    columns(){ return []; },
    pluck(){ return this; },
    expand(){ return this; },
    raw(){ return this; }
  };
}

const pgDb={
  prepare,
  exec(sql){
    const statements=String(sql).split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/).map(x=>x.trim()).filter(Boolean);
    for(const s of statements) callWorker(translateSql(s),[]);
  },
  pragma(){ return 1; },
  transaction(fn){
    return (...args)=>{
      if(inTransaction) return fn(...args);
      callWorker('BEGIN',[]); inTransaction=true;
      try{ const result=fn(...args); callWorker('COMMIT',[]); inTransaction=false; return result; }
      catch(e){ try{callWorker('ROLLBACK',[]);}catch{} inTransaction=false; throw e; }
    };
  },
  close(){ if(worker){worker.terminate();worker=null;} }
};

export const db = usePostgres ? pgDb : sqliteDb;
export function isPostgresMode(){ return usePostgres; }

export async function initPostgresMirror(){
  if(!usePostgres){ initialized=true; return; }
  if(!usePostgres) throw new Error('DATABASE_URL es obligatorio en la versión PostgreSQL.');
  ensureWorker();
  // Wake the worker and verify the connection.
  callWorker('SELECT 1 AS ok',[]);
  const schemaPath=path.join(here,'schema.postgres.sql');
  if(!fs.existsSync(schemaPath)) throw new Error('No se encontró schema.postgres.sql');
  const exists=callWorker("SELECT to_regclass('public.empresas') AS table_name",[]).rows[0]?.table_name;
  if(!exists){
    let schema=fs.readFileSync(schemaPath,'utf8');
    schema=schema.replace(/CREATE TABLE\s+/gi,'CREATE TABLE IF NOT EXISTS ').replace(/CREATE UNIQUE INDEX\s+/gi,'CREATE UNIQUE INDEX IF NOT EXISTS ').replace(/CREATE INDEX\s+/gi,'CREATE INDEX IF NOT EXISTS ');
    pgDb.exec(schema);
  }
  initialized=true;
}

export async function closePostgresMirror(){ if(usePostgres) pgDb.close(); else sqliteDb?.close(); initialized=false; }
