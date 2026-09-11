import { Router } from "express";
import crypto from "node:crypto";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { isM2MDataglobal, listSims, normalizeSim } from "../services/m2mProvider.js";

const r = Router();
const isAdmin = u => u.rol === "Administrador";
const scoped = (req, requested=0) => isAdmin(req.user) && Number(requested) ? Number(requested) : req.user.empresa_id;
const company = id => db.prepare("SELECT id,nombre,nit FROM empresas WHERE id=? AND estado=1").get(id);
function audit(req, accion, detalle, empresaId=req.user.empresa_id, resultado="OK") {
  db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(empresaId, req.user.id, accion, "INTEGRACIONES", detalle, req.ip, resultado, req.method, req.originalUrl, req.get("user-agent") || "");
}
function integration(id, req) {
  const x=db.prepare("SELECT * FROM integraciones WHERE id=?").get(id);
  if(!x || (!isAdmin(req.user) && x.empresa_id!==req.user.empresa_id)) return null;
  return x;
}
function logIntegration(x, operacion, resultado, mensaje="", httpStatus=null, duracion=0) {
  db.prepare("INSERT INTO integracion_logs(empresa_id,integracion_id,operacion,resultado,mensaje,http_status,duracion_ms) VALUES(?,?,?,?,?,?,?)")
    .run(x.empresa_id,x.id,operacion,resultado,String(mensaje).slice(0,4000),httpStatus,duracion);
  db.prepare("UPDATE integraciones SET ultima_sincronizacion=CASE WHEN ?='OK' THEN CURRENT_TIMESTAMP ELSE ultima_sincronizacion END,ultimo_resultado=?,ultimo_error=CASE WHEN ?='OK' THEN '' ELSE ? END,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?")
    .run(resultado,resultado,resultado,String(mensaje).slice(0,1000),x.id);
}
function token(){return crypto.randomBytes(24).toString("hex");}
function normalize(b={}) { return {
  nombre:String(b.nombre||"").trim(), tipo:String(b.tipo||"GPS").toUpperCase(), proveedor:String(b.proveedor||"").trim(), protocolo:String(b.protocolo||"REST_JSON").toUpperCase(),
  base_url:String(b.base_url||"").trim().replace(/\/$/,""), auth_tipo:String(b.auth_tipo||"BEARER").toUpperCase(), auth_token:String(b.auth_token||""),
  dispositivos_path:String(b.dispositivos_path||"/devices").trim(), consumo_path:String(b.consumo_path||"/sim/consumption").trim(), timeout_ms:Math.min(60000,Math.max(1000,Number(b.timeout_ms||10000))), estado:Number(b.estado??1),
  notas:String(b.notas||"").trim()
};}

r.get("/resumen", requireAuth, requirePermission("integraciones.ver"), (req,res)=>{
  const empresaId=scoped(req,req.query.empresa_id); if(!company(empresaId)) return res.status(400).json({error:"Empresa no válida o inactiva"});
  const c={integraciones:db.prepare("SELECT COUNT(*) n FROM integraciones WHERE empresa_id=? AND estado=1").get(empresaId).n,
    gps:db.prepare("SELECT COUNT(*) n FROM integraciones WHERE empresa_id=? AND estado=1 AND tipo IN ('GPS','AMBOS')").get(empresaId).n,
    m2m:db.prepare("SELECT COUNT(*) n FROM integraciones WHERE empresa_id=? AND estado=1 AND tipo IN ('M2M','AMBOS')").get(empresaId).n,
    mapeos:db.prepare("SELECT COUNT(*) n FROM integracion_mapeos WHERE empresa_id=? AND estado=1").get(empresaId).n,
    ok:db.prepare("SELECT COUNT(*) n FROM integracion_logs WHERE empresa_id=? AND resultado='OK' AND fecha>=datetime('now','-24 hours')").get(empresaId).n,
    errores:db.prepare("SELECT COUNT(*) n FROM integracion_logs WHERE empresa_id=? AND resultado='ERROR' AND fecha>=datetime('now','-24 hours')").get(empresaId).n};
  res.json({empresa_id:empresaId,kpis:c});
});

r.get("/", requireAuth, requirePermission("integraciones.ver"), (req,res)=>{
  const empresaId=scoped(req,req.query.empresa_id); if(!company(empresaId)) return res.status(400).json({error:"Empresa no válida"});
  const rows=db.prepare(`SELECT i.id,i.empresa_id,i.nombre,i.tipo,i.proveedor,i.protocolo,i.base_url,i.auth_tipo,i.dispositivos_path,i.consumo_path,i.timeout_ms,i.estado,i.webhook_token,i.ultima_sincronizacion,i.ultimo_resultado,i.ultimo_error,i.notas,e.nombre empresa,
    (SELECT COUNT(*) FROM integracion_mapeos m WHERE m.integracion_id=i.id AND m.estado=1) mapeos
    FROM integraciones i JOIN empresas e ON e.id=i.empresa_id WHERE i.empresa_id=? ORDER BY i.nombre`).all(empresaId);
  res.json({integraciones:rows,empresas:isAdmin(req.user)?db.prepare("SELECT id,nombre,nit FROM empresas WHERE estado=1 ORDER BY nombre").all():[company(empresaId)]});
});

r.post("/", requireAuth, requirePermission("integraciones.crear"), (req,res)=>{
  const d=normalize(req.body), empresaId=scoped(req,req.body?.empresa_id); if(!company(empresaId)) return res.status(400).json({error:"Empresa no válida"});
  if(!d.nombre) return res.status(400).json({error:"Ingrese el nombre de la integración"});
  if(!["GPS","M2M","AMBOS"].includes(d.tipo)) return res.status(400).json({error:"Tipo de integración no válido"});
  const wh=token(); const x=db.prepare(`INSERT INTO integraciones(empresa_id,nombre,tipo,proveedor,protocolo,base_url,auth_tipo,auth_token,dispositivos_path,consumo_path,timeout_ms,estado,webhook_token,notas,creado_por) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(empresaId,d.nombre,d.tipo,d.proveedor,d.protocolo,d.base_url,d.auth_tipo,d.auth_token,d.dispositivos_path,d.consumo_path,d.timeout_ms,d.estado,wh,d.notas,req.user.id);
  audit(req,"CREAR",`Creó integración ${d.nombre}`,empresaId); res.status(201).json({ok:true,id:Number(x.lastInsertRowid),webhook_token:wh});
});

r.put("/:id", requireAuth, requirePermission("integraciones.editar"), (req,res)=>{
  const cur=integration(Number(req.params.id),req); if(!cur) return res.status(404).json({error:"Integración no encontrada"});
  const d=normalize({...cur,...req.body}); if(!d.nombre) return res.status(400).json({error:"Ingrese el nombre de la integración"});
  const authToken=String(req.body?.auth_token||"").trim() ? d.auth_token : cur.auth_token;
  db.prepare(`UPDATE integraciones SET nombre=?,tipo=?,proveedor=?,protocolo=?,base_url=?,auth_tipo=?,auth_token=?,dispositivos_path=?,consumo_path=?,timeout_ms=?,estado=?,notas=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`).run(d.nombre,d.tipo,d.proveedor,d.protocolo,d.base_url,d.auth_tipo,authToken,d.dispositivos_path,d.consumo_path,d.timeout_ms,d.estado,d.notas,cur.id);
  audit(req,"EDITAR",`Editó integración ${d.nombre}`,cur.empresa_id); res.json({ok:true});
});

r.post("/:id/regenerar-webhook", requireAuth, requirePermission("integraciones.editar"), (req,res)=>{
  const cur=integration(Number(req.params.id),req); if(!cur) return res.status(404).json({error:"Integración no encontrada"}); const t=token(); db.prepare("UPDATE integraciones SET webhook_token=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(t,cur.id); audit(req,"REGENERAR_WEBHOOK",`Regeneró token de webhook ${cur.nombre}`,cur.empresa_id); res.json({ok:true,webhook_token:t});
});

r.delete("/:id", requireAuth, requirePermission("integraciones.eliminar"), (req,res)=>{const cur=integration(Number(req.params.id),req);if(!cur)return res.status(404).json({error:"Integración no encontrada"});db.prepare("UPDATE integraciones SET estado=0,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(cur.id);audit(req,"DESACTIVAR",`Desactivó integración ${cur.nombre}`,cur.empresa_id);res.json({ok:true})});

r.post("/:id/probar", requireAuth, requirePermission("integraciones.editar"), async (req,res)=>{
  const x=integration(Number(req.params.id),req); if(!x)return res.status(404).json({error:"Integración no encontrada"});
  if(!x.base_url)return res.status(400).json({error:"Configure la URL base antes de probar la conexión"});
  const started=Date.now();
  try {
    if(x.tipo!=="GPS" && isM2MDataglobal(x)){
      const result=await listSims(x);
      const items=Array.isArray(result.data?.data)?result.data.data:Array.isArray(result.data)?result.data:[];
      const preview=items.slice(0,3).map(normalizeSim);
      logIntegration(x,"PRUEBA_CONEXION","OK",`M2MDataglobal respondió correctamente. ${items.length} SIM(s) disponibles.`,result.status,result.durationMs);
      audit(req,"PRUEBA_CONEXION",`${x.nombre}: M2MDataglobal HTTP ${result.status}`,x.empresa_id,"OK");
      return res.json({ok:true,status:result.status,url:result.url,ms:result.durationMs,provider:"M2MDataglobal",total:items.length,preview});
    }
    let url=x.base_url; if(x.tipo!=="M2M") url+=x.dispositivos_path||"/devices"; else url+=x.consumo_path||"/sim/consumption";
    const headers={Accept:"application/json"}; if(x.auth_token){ if(x.auth_tipo==="API_KEY") headers["X-API-Key"]=x.auth_token; else headers.Authorization=`Bearer ${x.auth_token}`; }
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),x.timeout_ms||10000);
    try { const response=await fetch(url,{method:"GET",headers,signal:controller.signal}); const text=(await response.text()).slice(0,1000); const ok=response.ok; logIntegration(x,"PRUEBA_CONEXION",ok?"OK":"ERROR",text,response.status,Date.now()-started); audit(req,"PRUEBA_CONEXION",`${x.nombre}: HTTP ${response.status}`,x.empresa_id,ok?"OK":"ERROR"); return res.status(ok?200:502).json({ok,status:response.status,url,ms:Date.now()-started,preview:text}); }
    finally{clearTimeout(timer);}
  } catch(e){const msg=e.name==="AbortError"?"Tiempo de espera agotado":e.message;logIntegration(x,"PRUEBA_CONEXION","ERROR",msg,e.httpStatus||null,Date.now()-started);audit(req,"PRUEBA_CONEXION",`${x.nombre}: ${msg}`,x.empresa_id,"ERROR");return res.status(502).json({ok:false,error:msg,url:e.url||x.base_url,ms:Date.now()-started});}
});

r.post("/:id/sincronizar", requireAuth, requirePermission("integraciones.editar"), async (req,res)=>{
  const x=integration(Number(req.params.id),req); if(!x)return res.status(404).json({error:"Integración no encontrada"});
  if(!x.base_url)return res.status(400).json({error:"Configure la URL base antes de sincronizar"});
  const started=Date.now();
  if(x.tipo!=="GPS" && isM2MDataglobal(x)){
    try{
      const result=await listSims(x);
      const items=Array.isArray(result.data?.data)?result.data.data:Array.isArray(result.data)?result.data:[];
      let creadas=0,actualizadas=0,omitidas=0,consumos=0;
      for(const raw of items){
        const sim=normalizeSim(raw);
        if(!sim.iccid){omitidas++;continue;}
        let current=db.prepare("SELECT * FROM sim_cards WHERE empresa_id=? AND iccid=? LIMIT 1").get(x.empresa_id,sim.iccid);
        let planId=current?.plan_id||null;
        if(sim.planName){const plan=db.prepare("SELECT id FROM m2m_planes WHERE empresa_id=? AND nombre=? AND estado=1 LIMIT 1").get(x.empresa_id,sim.planName);if(plan)planId=plan.id;}
        if(!current){
          db.prepare("INSERT INTO sim_cards(empresa_id,iccid,equipo_id,imsi,numero,operador,plan_m2m,apn,estado,observaciones,creado_por,fecha_activacion,fecha_creacion,fecha_actualizacion,plan_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?)").run(x.empresa_id,sim.iccid,null,sim.imsi,sim.msisdn,sim.operator,sim.planName,sim.apn,sim.state,`Sincronizada desde ${x.proveedor}`,req.user.id,"",planId);
          creadas++;
          current=db.prepare("SELECT * FROM sim_cards WHERE empresa_id=? AND iccid=? LIMIT 1").get(x.empresa_id,sim.iccid);
        }else{
          db.prepare("UPDATE sim_cards SET imsi=?,numero=?,operador=?,plan_m2m=?,apn=?,estado=?,plan_id=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(sim.imsi,sim.msisdn,sim.operator,sim.planName,sim.apn,sim.state,planId,current.id);
          actualizadas++;
        }
        if(current && sim.consumptionMonthlyData>0){
          const periodo=new Date().toISOString().slice(0,7);
          const existing=db.prepare("SELECT id FROM m2m_consumos WHERE sim_id=? AND periodo=?").get(current.id,periodo);
          if(existing) db.prepare("UPDATE m2m_consumos SET mb_consumidos=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(sim.consumptionMonthlyData,existing.id);
          else db.prepare("INSERT INTO m2m_consumos(sim_id,periodo,mb_consumidos,fecha_actualizacion) VALUES(?,?,?,CURRENT_TIMESTAMP)").run(current.id,periodo,sim.consumptionMonthlyData);
          consumos++;
        }
      }
      logIntegration(x,"SINCRONIZAR_M2M","OK",`M2MDataglobal: ${items.length} SIM(s), ${creadas} nuevas, ${actualizadas} actualizadas.`,result.status,result.durationMs);
      audit(req,"SINCRONIZAR_M2M",`${x.nombre}: ${items.length} SIM(s), ${creadas} nuevas, ${actualizadas} actualizadas`,x.empresa_id,"OK");
      return res.json({ok:true,provider:"M2MDataglobal",total:items.length,procesados:creadas+actualizadas,creadas,actualizadas,omitidas,consumos,ms:result.durationMs});
    }catch(e){const msg=e.message||"Error de sincronización M2M";logIntegration(x,"SINCRONIZAR_M2M","ERROR",msg,e.httpStatus||null,Date.now()-started);audit(req,"SINCRONIZAR_M2M",`${x.nombre}: ${msg}`,x.empresa_id,"ERROR");return res.status(502).json({ok:false,error:msg,provider:"M2MDataglobal",ms:Date.now()-started});}
  }
  if(!["GPS","AMBOS"].includes(x.tipo)) return res.status(400).json({error:"Esta integración no tiene componente GPS"});
  const url=x.base_url+(x.dispositivos_path||"/devices"); const headers={Accept:"application/json"}; if(x.auth_token){if(x.auth_tipo==="API_KEY")headers["X-API-Key"]=x.auth_token;else headers.Authorization=`Bearer ${x.auth_token}`;}
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),x.timeout_ms||10000);
  try{const response=await fetch(url,{headers,signal:controller.signal});const text=await response.text();if(!response.ok)throw new Error(`HTTP ${response.status}: ${text.slice(0,500)}`);let data;try{data=JSON.parse(text)}catch{throw new Error("La respuesta no es JSON válido")};const items=Array.isArray(data)?data:(data.devices||data.data||data.results||[]);let processed=0;for(const item of items.slice(0,500)){const external=String(item.imei??item.id??item.deviceId??item.identifier??"").trim();if(!external)continue;const imei=String(item.imei??"").trim();let equipo=null;if(imei) equipo=db.prepare("SELECT id,empresa_id,imei FROM equipos WHERE empresa_id=? AND imei=?").get(x.empresa_id,imei);const m=db.prepare("SELECT id FROM integracion_mapeos WHERE integracion_id=? AND identificador_externo=?").get(x.id,external);if(m)db.prepare("UPDATE integracion_mapeos SET equipo_id=COALESCE(?,equipo_id),imei_externo=?,ultimo_estado=?,ultima_sincronizacion=CURRENT_TIMESTAMP,estado=1,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(equipo?.id||null,imei,String(item.status??item.state??""),m.id);else db.prepare("INSERT INTO integracion_mapeos(empresa_id,integracion_id,tipo_entidad,identificador_externo,equipo_id,imei_externo,ultimo_estado,ultima_sincronizacion,estado) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP,1)").run(x.empresa_id,x.id,"GPS",external,equipo?.id||null,imei,String(item.status??item.state??""));processed++;}logIntegration(x,"SINCRONIZAR_GPS","OK",`Procesados ${processed} dispositivo(s)`,response.status,Date.now()-started);audit(req,"SINCRONIZAR_GPS",`${x.nombre}: ${processed} dispositivo(s)`,x.empresa_id);res.json({ok:true,procesados:processed,total:items.length});}
  catch(e){logIntegration(x,"SINCRONIZAR_GPS","ERROR",e.message,null,Date.now()-started);audit(req,"SINCRONIZAR_GPS",`${x.nombre}: ${e.message}`,x.empresa_id,"ERROR");res.status(502).json({ok:false,error:e.message});}finally{clearTimeout(timer);}
});

r.get("/mapeos", requireAuth, requirePermission("integraciones.ver"), (req,res)=>{const empresaId=scoped(req,req.query.empresa_id);const rows=db.prepare(`SELECT m.*,i.nombre integracion,i.proveedor,g.imei equipo_imei,a.placa,c.nombre cliente FROM integracion_mapeos m JOIN integraciones i ON i.id=m.integracion_id LEFT JOIN equipos g ON g.id=m.equipo_id LEFT JOIN activos a ON a.id=g.activo_id LEFT JOIN clientes c ON c.id=a.cliente_id WHERE m.empresa_id=? ORDER BY m.ultima_sincronizacion DESC,m.id DESC LIMIT 500`).all(empresaId);res.json({mapeos:rows});});
r.delete("/mapeos/:id", requireAuth, requirePermission("integraciones.editar"), (req,res)=>{const m=db.prepare("SELECT * FROM integracion_mapeos WHERE id=?").get(Number(req.params.id));if(!m||(!isAdmin(req.user)&&m.empresa_id!==req.user.empresa_id))return res.status(404).json({error:"Mapeo no encontrado"});db.prepare("UPDATE integracion_mapeos SET estado=0,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(m.id);res.json({ok:true});});
r.get("/logs/listado", requireAuth, requirePermission("integraciones.ver"), (req,res)=>{const empresaId=scoped(req,req.query.empresa_id);const rows=db.prepare(`SELECT l.*,i.nombre integracion,i.proveedor FROM integracion_logs l JOIN integraciones i ON i.id=l.integracion_id WHERE l.empresa_id=? ORDER BY l.fecha DESC,l.id DESC LIMIT 300`).all(empresaId);res.json({logs:rows});});

// Webhook agnóstico de plataforma: acepta posición/eventos GPS y consumo/estado M2M.
r.post("/webhook/:token", (req,res)=>{
  const x=db.prepare("SELECT * FROM integraciones WHERE webhook_token=? AND estado=1").get(String(req.params.token)); if(!x)return res.status(404).json({error:"Webhook no encontrado"});
  const body=req.body||{}; const tipo=String(body.tipo||body.type||body.event_type||"").toUpperCase();
  try {
    if(["GPS","POSITION","LOCATION","EVENT","ALERTA","IGNITION","GPS_EVENT"].some(v=>tipo.includes(v)) || body.lat!==undefined || body.latitude!==undefined){
      const external=String(body.imei??body.deviceId??body.device_id??body.id??"").trim(); if(!external)return res.status(400).json({error:"Falta identificador del dispositivo"});
      const lat=Number(body.lat??body.latitude);const lng=Number(body.lng??body.lon??body.longitude);const event=String((body.evento??body.event??body.alarm??tipo)||"POSICION");
      db.prepare(`INSERT INTO gps_integracion_eventos(empresa_id,integracion_id,identificador_externo,evento,latitud,longitud,velocidad,ignicion,bateria,fecha_evento,payload_json) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(x.empresa_id,x.id,external,event,Number.isFinite(lat)?lat:null,Number.isFinite(lng)?lng:null,Number(body.velocidad??body.speed??0)||0,body.ignicion===true||body.ignition===true?1:body.ignicion===false||body.ignition===false?0:null,Number(body.bateria??body.battery??0)||null,body.fecha??body.timestamp??null,JSON.stringify(body).slice(0,12000));
    } else if(tipo.includes("M2M") || body.iccid || body.sim_id || body.mb_consumidos!==undefined || body.consumo_mb!==undefined){
      const iccid=String(body.iccid||"").trim(); const sim=iccid?db.prepare("SELECT id FROM sim_cards WHERE empresa_id=? AND iccid=?").get(x.empresa_id,iccid):null; if(sim){const periodo=String(body.periodo||new Date().toISOString().slice(0,7)).slice(0,7);const mb=Number(body.mb_consumidos??body.consumo_mb??0)||0;db.prepare("INSERT INTO m2m_consumos(sim_id,periodo,mb_consumidos,fecha_actualizacion) VALUES(?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(sim_id,periodo) DO UPDATE SET mb_consumidos=excluded.mb_consumidos,fecha_actualizacion=CURRENT_TIMESTAMP").run(sim.id,periodo,mb);}
    }
    logIntegration(x,"WEBHOOK","OK","Evento recibido",200,0); res.json({ok:true});
  } catch(e){logIntegration(x,"WEBHOOK","ERROR",e.message,500,0);res.status(500).json({error:"No fue posible procesar el evento"});}
});

export default r;
