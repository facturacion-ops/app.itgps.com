import nodemailer from "nodemailer";
import crypto from "node:crypto";
import { db } from "../db/database.js";

const key = () => crypto.createHash("sha256").update(process.env.JWT_SECRET || "dev-only-change-me").digest();
function encrypt(value="") { if(!value) return ""; const iv=crypto.randomBytes(12); const c=crypto.createCipheriv("aes-256-gcm",key(),iv); const enc=Buffer.concat([c.update(String(value),"utf8"),c.final()]); return [iv.toString("base64"),c.getAuthTag().toString("base64"),enc.toString("base64")].join("."); }
function decrypt(value="") { if(!value || !value.includes(".")) return value; try { const [iv,tag,data]=value.split("."); const d=crypto.createDecipheriv("aes-256-gcm",key(),Buffer.from(iv,"base64")); d.setAuthTag(Buffer.from(tag,"base64")); return Buffer.concat([d.update(Buffer.from(data,"base64")),d.final()]).toString("utf8"); } catch { return ""; } }
export function maskSmtp(row){ return row ? {...row, smtp_password: undefined, smtp_password_configured: !!row.smtp_password_enc} : null; }
function smtpFor(empresaId){ return db.prepare("SELECT * FROM notificaciones_smtp WHERE empresa_id=? AND activo=1").get(empresaId); }
function render(text, vars={}) { return String(text||"").replace(/{{\s*([\w.]+)\s*}}/g,(_,k)=>String(vars[k]??"")); }
export async function sendNotification({empresaId,event,to,vars={},attachments=[]}){
  const safeVars={...vars};
  if (Object.prototype.hasOwnProperty.call(safeVars,"enlace")) safeVars.enlace="[REDACTED]";
  if (Object.prototype.hasOwnProperty.call(safeVars,"password")) safeVars.password="[REDACTED]";
  const record=(subject,estado,mensaje="")=>db.prepare("INSERT INTO notificaciones_historial(empresa_id,evento_codigo,destinatario,asunto,estado,mensaje_error,fecha,metadata_json) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP,?)").run(empresaId,event,to||"",subject||"",estado,mensaje,JSON.stringify(safeVars));
  const cfg=smtpFor(empresaId); if(!cfg){const message="SMTP no configurado o inactivo";record("", "OMITIDO", message);return {ok:false,skipped:true,message};}
  const ev=db.prepare("SELECT * FROM notificaciones_eventos WHERE empresa_id=? AND codigo=?").get(empresaId,event);
  if(!ev || !ev.activo){const message="Evento desactivado";record("", "OMITIDO", message);return {ok:false,skipped:true,message};}
  const tpl=db.prepare("SELECT * FROM notificaciones_plantillas WHERE empresa_id=? AND evento_codigo=? AND activo=1 ORDER BY predeterminada DESC,id DESC LIMIT 1").get(empresaId,event);
  if(!tpl){const message="No existe plantilla activa";record("", "OMITIDO", message);return {ok:false,skipped:true,message};}
  const transport=nodemailer.createTransport({host:cfg.smtp_host,port:Number(cfg.smtp_port||587),secure:Number(cfg.smtp_port)===465||cfg.smtp_secure==="ssl",auth:{user:cfg.smtp_usuario,pass:decrypt(cfg.smtp_password_enc)},tls:{rejectUnauthorized:cfg.smtp_rechazar_certificado?true:false}});
  const mail={from:`${cfg.remitente_nombre||cfg.smtp_usuario} <${cfg.remitente_email||cfg.smtp_usuario}>`,to,replyTo:cfg.reply_to||undefined,subject:render(tpl.asunto,vars),html:render(tpl.cuerpo_html,vars),attachments};
  const started=Date.now(); let estado="ENVIADO",error="";
  try { await transport.sendMail(mail); }
  catch(e){ estado="ERROR"; error=e.message||String(e); }
  record(mail.subject,estado,error);
  return {ok:estado==="ENVIADO",estado,error,duration_ms:Date.now()-started};
}
export function setSmtpPassword(value){ return encrypt(value); }
export function createMailerForEmpresa(empresaId){
  const cfg=smtpFor(empresaId); if(!cfg) throw new Error("SMTP no configurado o inactivo");
  return nodemailer.createTransport({host:cfg.smtp_host,port:Number(cfg.smtp_port||587),secure:Number(cfg.smtp_port)===465||cfg.smtp_secure==="ssl",auth:{user:cfg.smtp_usuario,pass:decrypt(cfg.smtp_password_enc)},tls:{rejectUnauthorized:cfg.smtp_rechazar_certificado?true:false}});
}
export function decryptSmtpPassword(value){ return decrypt(value); }

export async function processScheduledNotifications(){
  const empresas=db.prepare("SELECT id,nombre FROM empresas WHERE estado=1").all();
  const today=new Date(); const iso=today.toISOString().slice(0,10);
  const addDays=(n)=>{const d=new Date(today);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
  for(const emp of empresas){
    const pending=(event,entityType,entityId)=>!db.prepare("SELECT id FROM notificaciones_historial WHERE empresa_id=? AND evento_codigo=? AND metadata_json LIKE ? LIMIT 1").get(emp.id,event,`%\"${entityType}_id\":${entityId}%`);
    const sendInvoice=async(row,event)=>{const c=db.prepare("SELECT correo,nombre,nombre_comercial,razon_social FROM clientes WHERE id=? AND empresa_id=?").get(row.cliente_id,emp.id);if(!c?.correo||!pending(event,"factura",row.id))return;await sendNotification({empresaId:emp.id,event,to:c.correo,vars:{cliente:c.nombre_comercial||c.razon_social||c.nombre||"Cliente",numero:row.codigo,total:row.total,vencimiento:row.fecha_vencimiento||"",empresa:emp.nombre,factura_id:row.id}})};
    const proximas=db.prepare("SELECT * FROM facturas WHERE empresa_id=? AND estado NOT IN ('Pagada','Anulada') AND fecha_vencimiento<>'' AND date(fecha_vencimiento) BETWEEN date(?) AND date(?)").all(emp.id,iso,addDays(3)); for(const x of proximas) await sendInvoice(x,"FACTURA_PROXIMA_VENCER");
    const vencidas=db.prepare("SELECT * FROM facturas WHERE empresa_id=? AND estado NOT IN ('Pagada','Anulada') AND fecha_vencimiento<>'' AND date(fecha_vencimiento)<date(?)").all(emp.id,iso); for(const x of vencidas) await sendInvoice(x,"FACTURA_VENCIDA");
    const subs=db.prepare("SELECT s.*,c.correo,c.nombre,c.nombre_comercial,c.razon_social,p.nombre plan,sv.nombre servicio FROM suscripciones s JOIN clientes c ON c.id=s.cliente_id JOIN planes p ON p.id=s.plan_id JOIN servicios sv ON sv.id=p.servicio_id WHERE s.empresa_id=? AND s.estado='Activa' AND s.fecha_fin<>'' AND date(s.fecha_fin) BETWEEN date(?) AND date(?)").all(emp.id,iso,addDays(30)); for(const x of subs) if(x.correo&&pending("RENOVACION_PROXIMA","suscripcion",x.id)) await sendNotification({empresaId:emp.id,event:"RENOVACION_PROXIMA",to:x.correo,vars:{nombre:x.nombre,cliente:x.nombre_comercial||x.razon_social||x.nombre,empresa:emp.nombre,plan:x.plan,servicio:x.servicio,vencimiento:x.fecha_fin,suscripcion_id:x.id}});
    const cons=db.prepare("SELECT c.*,cl.correo,cl.nombre,cl.nombre_comercial,cl.razon_social FROM contratos c JOIN clientes cl ON cl.id=c.cliente_id WHERE c.empresa_id=? AND c.estado='Activo' AND c.fecha_fin<>'' AND date(c.fecha_fin) BETWEEN date(?) AND date(?)").all(emp.id,iso,addDays(30)); for(const x of cons) if(x.correo&&pending("CONTRATO_PROXIMO_VENCER","contrato",x.id)) await sendNotification({empresaId:emp.id,event:"CONTRATO_PROXIMO_VENCER",to:x.correo,vars:{nombre:x.nombre,cliente:x.nombre_comercial||x.razon_social||x.nombre,empresa:emp.nombre,numero:x.codigo,vencimiento:x.fecha_fin,contrato_id:x.id}});
  }
}
