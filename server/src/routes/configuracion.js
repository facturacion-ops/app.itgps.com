import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { maskSmtp, setSmtpPassword, decryptSmtpPassword } from "../services/notifications.js";
import nodemailer from "nodemailer";

const r = Router();
const isAdmin = u => u.rol === "Administrador";
const companyId = (req, requested) => isAdmin(req.user) && Number(requested) ? Number(requested) : req.user.empresa_id;
const clean = (v, max=5000) => String(v ?? "").trim().slice(0,max);
function audit(req, accion, detalle, empresaId=req.user.empresa_id, resultado="OK") {
  db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(empresaId, req.user.id, accion, "CONFIGURACION", detalle, req.ip, resultado, req.method, req.originalUrl, req.get("user-agent") || "");
}
function getConfig(id) {
  let c = db.prepare("SELECT * FROM configuracion_empresa WHERE empresa_id=?").get(id);
  if (!c) {
    db.prepare("INSERT OR IGNORE INTO configuracion_empresa(empresa_id) VALUES(?)").run(id);
    c = db.prepare("SELECT * FROM configuracion_empresa WHERE empresa_id=?").get(id);
  }
  return c;
}
function publicConfig(c) {
  return { ...c };
}

r.get("/", requireAuth, requirePermission("configuracion.ver"), (req,res) => {
  const id = companyId(req, req.query.empresa_id);
  const empresa = db.prepare("SELECT id,nombre,nit,estado FROM empresas WHERE id=? AND estado=1").get(id);
  if (!empresa) return res.status(400).json({error:"Empresa no válida o inactiva"});
  const config = getConfig(id);
  const marca = db.prepare("SELECT * FROM empresa_marca WHERE empresa_id=?").get(id) || null;
  const facturacion = db.prepare("SELECT * FROM facturacion_config WHERE empresa_id=?").get(id) || null;
  res.json({empresa, config:publicConfig(config), marca, facturacion, empresas:isAdmin(req.user)?db.prepare("SELECT id,nombre,nit FROM empresas WHERE estado=1 ORDER BY nombre").all():[empresa]});
});

r.put("/", requireAuth, requirePermission("configuracion.editar"), (req,res) => {
  const id = companyId(req, req.body?.empresa_id);
  const empresa = db.prepare("SELECT id FROM empresas WHERE id=? AND estado=1").get(id);
  if (!empresa) return res.status(400).json({error:"Empresa no válida o inactiva"});
  const b=req.body||{};
  const data={
    app_nombre:clean(b.app_nombre,120), zona_horaria:clean(b.zona_horaria,80)||"America/Bogota", formato_fecha:clean(b.formato_fecha,30)||"DD/MM/YYYY", formato_numerico:clean(b.formato_numerico,30)||"es-CO", moneda:clean(b.moneda,10)||"COP",
    idioma:clean(b.idioma,20)||"es-CO", session_minutes:Math.min(1440,Math.max(15,Number(b.session_minutes||480))), max_login_attempts:Math.min(20,Math.max(3,Number(b.max_login_attempts||5))), lock_minutes:Math.min(240,Math.max(1,Number(b.lock_minutes||15))),
    password_min_length:Math.min(64,Math.max(8,Number(b.password_min_length||8))), password_upper:Number(b.password_upper)?1:0, password_lower:Number(b.password_lower)?1:0, password_number:Number(b.password_number)?1:0, password_special:Number(b.password_special)?1:0,
    audit_retention_days:Math.min(3650,Math.max(30,Number(b.audit_retention_days||365))), api_rate_limit:Math.min(1000,Math.max(30,Number(b.api_rate_limit||120))),
    email_remitente:clean(b.email_remitente,180), email_nombre:clean(b.email_nombre,120), notificaciones_activas:Number(b.notificaciones_activas)?1:0,
    backup_habilitado:Number(b.backup_habilitado)?1:0, backup_retencion_dias:Math.min(3650,Math.max(1,Number(b.backup_retencion_dias||30)))
  };
  if (b.marca) {
    const m=b.marca;
    db.prepare(`INSERT INTO empresa_marca(empresa_id,nombre_aplicacion,nombre_comercial,logo_principal,logo_secundario,favicon,color_principal,color_secundario,color_acento,encabezado,pie_pagina,texto_legal,terminos_condiciones,firma_nombre,firma_cargo,datos_bancarios,moneda,formato_fecha,formato_numerico,zona_horaria)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(empresa_id) DO UPDATE SET nombre_aplicacion=excluded.nombre_aplicacion,nombre_comercial=excluded.nombre_comercial,logo_principal=excluded.logo_principal,color_principal=excluded.color_principal,color_secundario=excluded.color_secundario,color_acento=excluded.color_acento,encabezado=excluded.encabezado,pie_pagina=excluded.pie_pagina,texto_legal=excluded.texto_legal,terminos_condiciones=excluded.terminos_condiciones,firma_nombre=excluded.firma_nombre,firma_cargo=excluded.firma_cargo,datos_bancarios=excluded.datos_bancarios,moneda=excluded.moneda,formato_fecha=excluded.formato_fecha,formato_numerico=excluded.formato_numerico,zona_horaria=excluded.zona_horaria,fecha_actualizacion=CURRENT_TIMESTAMP`).run(id,clean(m.nombre_aplicacion,120),clean(m.nombre_comercial,180),clean(m.logo_principal,2000000),clean(m.logo_secundario,2000000),clean(m.favicon,200000),clean(m.color_principal,20)||'#0A1E2E',clean(m.color_secundario,20)||'#F5F8FA',clean(m.color_acento,20)||'#8CF63C',clean(m.encabezado,2000),clean(m.pie_pagina,2000),clean(m.texto_legal,5000),clean(m.terminos_condiciones,10000),clean(m.firma_nombre,180),clean(m.firma_cargo,180),clean(m.datos_bancarios,3000),clean(m.moneda,10)||data.moneda,data.formato_fecha,data.formato_numerico,data.zona_horaria);
  }
  db.prepare(`INSERT INTO configuracion_empresa(empresa_id,app_nombre,zona_horaria,formato_fecha,formato_numerico,moneda,idioma,session_minutes,max_login_attempts,lock_minutes,password_min_length,password_upper,password_lower,password_number,password_special,audit_retention_days,api_rate_limit,email_remitente,email_nombre,notificaciones_activas,backup_habilitado,backup_retencion_dias)
    VALUES(@empresa_id,@app_nombre,@zona_horaria,@formato_fecha,@formato_numerico,@moneda,@idioma,@session_minutes,@max_login_attempts,@lock_minutes,@password_min_length,@password_upper,@password_lower,@password_number,@password_special,@audit_retention_days,@api_rate_limit,@email_remitente,@email_nombre,@notificaciones_activas,@backup_habilitado,@backup_retencion_dias)
    ON CONFLICT(empresa_id) DO UPDATE SET app_nombre=excluded.app_nombre,zona_horaria=excluded.zona_horaria,formato_fecha=excluded.formato_fecha,formato_numerico=excluded.formato_numerico,moneda=excluded.moneda,idioma=excluded.idioma,session_minutes=excluded.session_minutes,max_login_attempts=excluded.max_login_attempts,lock_minutes=excluded.lock_minutes,password_min_length=excluded.password_min_length,password_upper=excluded.password_upper,password_lower=excluded.password_lower,password_number=excluded.password_number,password_special=excluded.password_special,audit_retention_days=excluded.audit_retention_days,api_rate_limit=excluded.api_rate_limit,email_remitente=excluded.email_remitente,email_nombre=excluded.email_nombre,notificaciones_activas=excluded.notificaciones_activas,backup_habilitado=excluded.backup_habilitado,backup_retencion_dias=excluded.backup_retencion_dias,fecha_actualizacion=CURRENT_TIMESTAMP`).run({empresa_id:id,...data});
  audit(req,"EDITAR",`Actualizó configuración de empresa ${id}`,id);
  res.json({ok:true,config:getConfig(id)});
});

r.get("/produccion", requireAuth, requirePermission("configuracion.ver"), (req,res) => {
  const started=Date.now();
  let integrity="OK";
  try { db.pragma("integrity_check"); } catch { integrity="ERROR"; }
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(x=>x.name);
  const empresaId=companyId(req,req.query.empresa_id);
  const stats={usuarios:db.prepare("SELECT COUNT(*) n FROM usuarios WHERE empresa_id=?").get(empresaId).n,clientes:db.prepare("SELECT COUNT(*) n FROM clientes WHERE empresa_id=?").get(empresaId).n,equipos:db.prepare("SELECT COUNT(*) n FROM equipos WHERE empresa_id=?").get(empresaId).n,integraciones:db.prepare("SELECT COUNT(*) n FROM integraciones WHERE empresa_id=? AND estado=1").get(empresaId).n};
  res.json({ok:integrity==="OK",integrity,latency_ms:Date.now()-started,node:process.version,environment:process.env.NODE_ENV||"development",port:Number(process.env.PORT||3001),database:"SQLite",tables:tables.length,stats,checked_at:new Date().toISOString()});
});


r.get("/notificaciones", requireAuth, requirePermission("configuracion.ver"), (req,res)=>{
  const id=companyId(req,req.query.empresa_id); const smtp=db.prepare("SELECT * FROM notificaciones_smtp WHERE empresa_id=?").get(id)||null;
  const eventos=db.prepare("SELECT * FROM notificaciones_eventos WHERE empresa_id=? ORDER BY nombre").all(id);
  const plantillas=db.prepare("SELECT id,empresa_id,evento_codigo,nombre,asunto,cuerpo_html,predeterminada,activo,fecha_actualizacion FROM notificaciones_plantillas WHERE empresa_id=? ORDER BY evento_codigo,nombre").all(id);
  res.json({smtp:maskSmtp(smtp),eventos,plantillas,empresas:isAdmin(req.user)?db.prepare("SELECT id,nombre FROM empresas WHERE estado=1 ORDER BY nombre").all():[]});
});

r.put("/notificaciones/smtp", requireAuth, requirePermission("configuracion.editar"), (req,res)=>{
  const id=companyId(req,req.body?.empresa_id), b=req.body||{};
  if(!db.prepare("SELECT id FROM empresas WHERE id=? AND estado=1").get(id)) return res.status(400).json({error:"Empresa no válida"});
  const current=db.prepare("SELECT * FROM notificaciones_smtp WHERE empresa_id=?").get(id);
  const password = b.smtp_password ? setSmtpPassword(b.smtp_password) : (current?.smtp_password_enc||"");
  db.prepare(`INSERT INTO notificaciones_smtp(empresa_id,smtp_host,smtp_port,smtp_secure,smtp_usuario,smtp_password_enc,smtp_rechazar_certificado,remitente_email,remitente_nombre,reply_to,activo)
    VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(empresa_id) DO UPDATE SET smtp_host=excluded.smtp_host,smtp_port=excluded.smtp_port,smtp_secure=excluded.smtp_secure,smtp_usuario=excluded.smtp_usuario,smtp_password_enc=excluded.smtp_password_enc,smtp_rechazar_certificado=excluded.smtp_rechazar_certificado,remitente_email=excluded.remitente_email,remitente_nombre=excluded.remitente_nombre,reply_to=excluded.reply_to,activo=excluded.activo,fecha_actualizacion=CURRENT_TIMESTAMP`).run(id,clean(b.smtp_host,255),Number(b.smtp_port||587),clean(b.smtp_secure,20)||"starttls",clean(b.smtp_usuario,255),password,Number(b.smtp_rechazar_certificado??1)?1:0,clean(b.remitente_email,255),clean(b.remitente_nombre,180),clean(b.reply_to,255),Number(b.activo)?1:0);
  audit(req,"SMTP",`Actualizó SMTP de empresa ${id}`,id); res.json({ok:true,smtp:maskSmtp(db.prepare("SELECT * FROM notificaciones_smtp WHERE empresa_id=?").get(id))});
});

r.post("/notificaciones/smtp/test", requireAuth, requirePermission("configuracion.editar"), async (req,res)=>{
  const id=companyId(req,req.body?.empresa_id), row=db.prepare("SELECT * FROM notificaciones_smtp WHERE empresa_id=?").get(id); if(!row)return res.status(404).json({error:"SMTP no configurado"});
  try { const transport=nodemailer.createTransport({host:row.smtp_host,port:Number(row.smtp_port||587),secure:Number(row.smtp_port)===465||row.smtp_secure==="ssl",auth:{user:row.smtp_usuario,pass:decryptSmtpPassword(row.smtp_password_enc)},tls:{rejectUnauthorized:!!row.smtp_rechazar_certificado}}); await transport.verify(); res.json({ok:true,message:"Conexión SMTP verificada correctamente."}); } catch(e){res.status(400).json({ok:false,error:e.message||"No fue posible verificar SMTP"});}
});

r.post("/notificaciones/smtp/test-email", requireAuth, requirePermission("configuracion.editar"), async (req,res)=>{
  const id=companyId(req,req.body?.empresa_id), row=db.prepare("SELECT * FROM notificaciones_smtp WHERE empresa_id=?").get(id), to=String(req.body?.destinatario||"").trim(); if(!row)return res.status(404).json({error:"SMTP no configurado"}); if(!to)return res.status(400).json({error:"Destinatario obligatorio"});
  try { const transport=nodemailer.createTransport({host:row.smtp_host,port:Number(row.smtp_port||587),secure:Number(row.smtp_port)===465||row.smtp_secure==="ssl",auth:{user:row.smtp_usuario,pass:decryptSmtpPassword(row.smtp_password_enc)},tls:{rejectUnauthorized:!!row.smtp_rechazar_certificado}}); await transport.sendMail({from:`${row.remitente_nombre||row.smtp_usuario} <${row.remitente_email||row.smtp_usuario}>`,to,replyTo:row.reply_to||undefined,subject:"Prueba SMTP · IT GPS APP",html:"<h2>SMTP configurado correctamente</h2><p>Este es un correo de prueba generado por IT GPS APP.</p>"}); res.json({ok:true,message:"Correo de prueba enviado."}); } catch(e){res.status(400).json({ok:false,error:e.message||"No fue posible enviar el correo"});}
});

r.put("/notificaciones/eventos/:id", requireAuth, requirePermission("configuracion.editar"), (req,res)=>{const id=Number(req.params.id), row=db.prepare("SELECT * FROM notificaciones_eventos WHERE id=?").get(id); if(!row || (!isAdmin(req.user)&&row.empresa_id!==req.user.empresa_id))return res.status(404).json({error:"Evento no encontrado"}); db.prepare("UPDATE notificaciones_eventos SET activo=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(Number(req.body?.activo)?1:0,id); res.json({ok:true});});

r.post("/notificaciones/plantillas", requireAuth, requirePermission("configuracion.crear"), (req,res)=>{const id=companyId(req,req.body?.empresa_id),b=req.body||{}; if(!b.evento_codigo||!b.nombre||!b.asunto||!b.cuerpo_html)return res.status(400).json({error:"Evento, nombre, asunto y cuerpo son obligatorios"}); const ins=db.prepare("INSERT INTO notificaciones_plantillas(empresa_id,evento_codigo,nombre,asunto,cuerpo_html,predeterminada,activo) VALUES(?,?,?,?,?,?,?)").run(id,clean(b.evento_codigo,80),clean(b.nombre,180),clean(b.asunto,500),clean(b.cuerpo_html,50000),Number(b.predeterminada)?1:0,Number(b.activo??1)?1:0); res.status(201).json({ok:true,id:Number(ins.lastInsertRowid)});});
r.put("/notificaciones/plantillas/:id", requireAuth, requirePermission("configuracion.editar"), (req,res)=>{const id=Number(req.params.id),row=db.prepare("SELECT * FROM notificaciones_plantillas WHERE id=?").get(id);if(!row||(!isAdmin(req.user)&&row.empresa_id!==req.user.empresa_id))return res.status(404).json({error:"Plantilla no encontrada"});const b=req.body||{};db.prepare("UPDATE notificaciones_plantillas SET evento_codigo=?,nombre=?,asunto=?,cuerpo_html=?,predeterminada=?,activo=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(clean(b.evento_codigo,80),clean(b.nombre,180),clean(b.asunto,500),clean(b.cuerpo_html,50000),Number(b.predeterminada)?1:0,Number(b.activo??1)?1:0,id);res.json({ok:true});});
r.delete("/notificaciones/plantillas/:id", requireAuth, requirePermission("configuracion.eliminar"), (req,res)=>{const id=Number(req.params.id),row=db.prepare("SELECT empresa_id FROM notificaciones_plantillas WHERE id=?").get(id);if(!row||(!isAdmin(req.user)&&row.empresa_id!==req.user.empresa_id))return res.status(404).json({error:"Plantilla no encontrada"});db.prepare("DELETE FROM notificaciones_plantillas WHERE id=?").run(id);res.json({ok:true});});
r.get("/notificaciones/historial", requireAuth, requirePermission("configuracion.ver"), (req,res)=>{const id=companyId(req,req.query.empresa_id);res.json({items:db.prepare("SELECT * FROM notificaciones_historial WHERE empresa_id=? ORDER BY id DESC LIMIT 200").all(id)});});

export default r;
