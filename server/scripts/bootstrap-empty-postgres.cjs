#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.INITIAL_ADMIN_EMAIL;
const password = process.env.INITIAL_ADMIN_PASSWORD;
const nombre = process.env.INITIAL_ADMIN_NAME || 'Administrador';

if (!databaseUrl) throw new Error('Falta DATABASE_URL.');
if (!email) throw new Error('Falta INITIAL_ADMIN_EMAIL.');
if (!password || password.length < 8) throw new Error('INITIAL_ADMIN_PASSWORD debe tener al menos 8 caracteres.');

const client = new Client({
  connectionString: databaseUrl,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false }
});

const modules = [
  ['dashboard','Dashboard'],['prospectos','Prospectos'],['clientes','Clientes'],['activos','Activos'],
  ['equipos','Equipos GPS'],['sim','Tarjetas SIM'],['m2m','Gestión M2M'],['reportes','Reportes'],
  ['gestion','Gestión'],['configuracion','Configuración'],['usuarios','Usuarios'],['roles','Roles y permisos'],
  ['empresas','Empresas'],['auditoria','Auditoría'],['consolidacion','Consolidación operacional']
];
const actions = [['ver','Ver'],['crear','Crear'],['editar','Editar'],['eliminar','Eliminar'],['exportar','Exportar']];

(async()=>{
  await client.connect();
  try {
    const hasTables = await client.query("SELECT to_regclass('public.usuarios') AS table_name");
    if (!hasTables.rows[0].table_name) {
      const schemaPath = path.join(__dirname, '../src/db/schema.postgres.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schema);
    }

    const users = Number((await client.query('SELECT COUNT(*)::int AS n FROM usuarios')).rows[0].n);
    const companies = Number((await client.query('SELECT COUNT(*)::int AS n FROM empresas')).rows[0].n);
    if (users !== 0 || companies !== 0) {
      throw new Error(`La base no está vacía (usuarios=${users}, empresas=${companies}). No se modificó ningún dato.`);
    }

    await client.query('BEGIN');
    const empresa = (await client.query(
      "INSERT INTO empresas(nombre,nit) VALUES($1,$2) RETURNING id",
      ['IT GPS','900000000-0']
    )).rows[0];

    const roles = ['Administrador','Supervisor','Comercial','Operador','Consulta'];
    for (const role of roles) await client.query('INSERT INTO roles(nombre) VALUES($1) ON CONFLICT(nombre) DO NOTHING',[role]);
    for (const [modulo,nombreModulo] of modules) {
      for (const [accion,accionNombre] of actions) {
        await client.query(
          'INSERT INTO permisos(codigo,nombre,modulo,accion) VALUES($1,$2,$3,$4) ON CONFLICT(codigo) DO NOTHING',
          [`${modulo}.${accion}`,`${accionNombre} ${nombreModulo}`,modulo,accion]
        );
      }
    }
    const adminRole = (await client.query("SELECT id FROM roles WHERE nombre='Administrador'")).rows[0];
    const permissions = (await client.query('SELECT id FROM permisos')).rows;
    for (const p of permissions) {
      await client.query('INSERT INTO rol_permisos(rol_id,permiso_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[adminRole.id,p.id]);
    }
    const hash = await bcrypt.hash(password,12);
    const user = (await client.query(
      'INSERT INTO usuarios(empresa_id,rol_id,nombre,apellido,correo,password_hash) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,correo',
      [empresa.id,adminRole.id,nombre,'IT GPS',email,hash]
    )).rows[0];

    await client.query('INSERT INTO configuracion_empresa(empresa_id) VALUES($1) ON CONFLICT(empresa_id) DO NOTHING',[empresa.id]);
    await client.query('INSERT INTO empresa_marca(empresa_id,nombre_aplicacion,nombre_comercial) VALUES($1,$2,$3) ON CONFLICT(empresa_id) DO NOTHING',[empresa.id,'IT GPS APP','IT GPS']);
    await client.query('INSERT INTO facturacion_config(empresa_id) VALUES($1) ON CONFLICT(empresa_id) DO NOTHING',[empresa.id]);
    await client.query('COMMIT');
    console.log(`Base limpia inicializada. Usuario administrador: ${user.correo}`);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    throw e;
  } finally {
    await client.end();
  }
})().catch(e=>{ console.error(e.message); process.exit(1); });
