import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r = Router();
const isAdmin = u => u.rol === "Administrador";
const today = () => new Date().toISOString().slice(0, 10);
const periodParts = periodo => { const m = String(periodo||"").match(/^(\d{4})-(0[1-9]|1[0-2])$/); if(!m) return null; return {y:Number(m[1]),m:Number(m[2])}; };
const periodDates = periodo => { const p=periodParts(periodo); if(!p) return null; const start=`${p.y}-${String(p.m).padStart(2,"0")}-01`; const last=new Date(Date.UTC(p.y,p.m,0)).getUTCDate(); return {inicio:start,fin:`${p.y}-${String(p.m).padStart(2,"0")}-${String(last).padStart(2,"0")}`}; };
function company(req){ return isAdmin(req.user)&&Number(req.query.empresa_id||0)?Number(req.query.empresa_id):req.user.empresa_id; }
function allowedCompany(req, empresaId){ return isAdmin(req.user)||Number(empresaId)===Number(req.user.empresa_id); }
function audit(req,accion,detalle,empresaId=req.user.empresa_id){try{db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)").run(empresaId,req.user.id,accion,"FACTURACION_RECURRENTE",detalle,req.ip,"OK",req.method,req.originalUrl,req.get("user-agent")||"")}catch(e){}}
function nextCode(empresa){const rows=db.prepare("SELECT codigo FROM facturas WHERE empresa_id=? AND codigo<>''").all(empresa);let max=0;for(const x of rows){const m=String(x.codigo||"").match(/^FAC-?(\d+)$/i);if(m)max=Math.max(max,Number(m[1]))}return `FAC${String(max+1).padStart(4,"0")}`;}
function monthsDiff(a,b){return (b.y-a.y)*12+(b.m-a.m);}
function dueDate(periodo,day,dias){const p=periodParts(periodo);const max=new Date(Date.UTC(p.y,p.m,0)).getUTCDate();const d=Math.min(Math.max(1,Number(day||1)),max);const base=new Date(Date.UTC(p.y,p.m-1,d));base.setUTCDate(base.getUTCDate()+Math.max(0,Number(dias||0)));return base.toISOString().slice(0,10);}
function eligible(s,periodo){
  const pp=periodParts(periodo); if(!pp || s.estado!=="Activa") return false;
  const start=String(s.fecha_inicio||"").slice(0,7); const sp=periodParts(start); if(!sp) return false;
  if(periodo<start) return false;
  if(s.fecha_fin && String(s.fecha_fin).slice(0,10)<periodDates(periodo).inicio) return false;
  const periodicidad=String(s.periodicidad||s.plan_periodicidad||"Mensual").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const diff=monthsDiff(sp,pp);
  if(diff<0) return false;
  if(periodicidad.includes("bimes")) return diff%2===0;
  if(periodicidad.includes("trimes")) return diff%3===0;
  if(periodicidad.includes("semes")) return diff%6===0;
  if(periodicidad.includes("anual")||periodicidad.includes("anual")) return diff%12===0;
  if(periodicidad.includes("unica")||periodicidad.includes("unico")) return false;
  return true;
}
function subscriptionRows(empresa,periodo){
  const rows=db.prepare(`SELECT s.*,c.nombre cliente,c.razon_social,c.nombre_comercial,p.nombre plan,p.codigo plan_codigo,p.periodicidad plan_periodicidad,p.modalidad plan_modalidad,sv.nombre servicio
    FROM suscripciones s JOIN clientes c ON c.id=s.cliente_id JOIN planes p ON p.id=s.plan_id JOIN servicios sv ON sv.id=p.servicio_id
    WHERE s.empresa_id=? AND s.estado='Activa' ORDER BY c.razon_social,c.nombre,s.codigo`).all(empresa);
  return rows.filter(s=>String(s.plan_modalidad||"Recurrente").toLowerCase()==="recurrente" && eligible(s,periodo));
}
function ensurePeriod(empresa,periodo,userId){
  const dates=periodDates(periodo); if(!dates) throw new Error("El período debe tener formato AAAA-MM.");
  let p=db.prepare("SELECT * FROM facturacion_periodos WHERE empresa_id=? AND periodo=?").get(empresa,periodo);
  if(!p){const x=db.prepare("INSERT INTO facturacion_periodos(empresa_id,periodo,fecha_inicio,fecha_fin,estado,abierto_por) VALUES(?,?,?,?,\'Abierto\',?)").run(empresa,periodo,dates.inicio,dates.fin,userId);p=db.prepare("SELECT * FROM facturacion_periodos WHERE id=?").get(Number(x.lastInsertRowid));}
  return p;
}

function refreshOverdue(empresa){
  const fecha=today();
  return db.prepare("UPDATE facturas SET estado='Vencida',fecha_actualizacion=CURRENT_TIMESTAMP WHERE empresa_id=? AND estado='Emitida' AND fecha_vencimiento<>'' AND fecha_vencimiento<? AND total > COALESCE((SELECT SUM(valor) FROM pagos_cartera p WHERE p.factura_id=facturas.id AND p.estado='Aplicado'),0)").run(empresa,fecha).changes;
}
function recurrentSummary(empresa){
  const hoy=today();
  const base=db.prepare(`SELECT COUNT(*) total,COALESCE(SUM(f.total),0) valor FROM facturas f WHERE f.empresa_id=? AND f.suscripcion_id IS NOT NULL AND f.periodo_facturacion<>'' AND f.estado NOT IN ('Borrador','Anulada')`).get(empresa);
  const saldo=db.prepare(`SELECT COALESCE(SUM(MAX(f.total-COALESCE((SELECT SUM(p.valor) FROM pagos_cartera p WHERE p.factura_id=f.id AND p.estado='Aplicado'),0),0)),0) saldo FROM facturas f WHERE f.empresa_id=? AND f.suscripcion_id IS NOT NULL AND f.periodo_facturacion<>'' AND f.estado NOT IN ('Borrador','Anulada')`).get(empresa);
  const vencido=db.prepare(`SELECT COALESCE(SUM(MAX(f.total-COALESCE((SELECT SUM(p.valor) FROM pagos_cartera p WHERE p.factura_id=f.id AND p.estado='Aplicado'),0),0)),0) saldo FROM facturas f WHERE f.empresa_id=? AND f.suscripcion_id IS NOT NULL AND f.estado='Vencida' AND f.fecha_vencimiento<?`).get(empresa,hoy);
  const pendientes=db.prepare(`SELECT COUNT(*) total,COALESCE(SUM(MAX(0,COALESCE(s.cantidad,1)*COALESCE(s.precio,0)-COALESCE(s.descuento,0))),0) valor FROM suscripciones s JOIN planes p ON p.id=s.plan_id WHERE s.empresa_id=? AND s.estado='Activa' AND LOWER(COALESCE(p.modalidad,'Recurrente'))='recurrente'`).get(empresa);
  return {facturas_recurrentes:Number(base.total||0),facturado:Number(base.valor||0),saldo_pendiente:Number(saldo.saldo||0),saldo_vencido:Number(vencido.saldo||0),suscripciones_activas:Number(pendientes.total||0),valor_suscripciones_activas:Number(pendientes.valor||0)};
}

r.get("/resumen",requireAuth,requirePermission("cartera.ver"),(req,res)=>{
  const empresa=company(req),vencidas=refreshOverdue(empresa),config=db.prepare("SELECT * FROM facturacion_config WHERE empresa_id=?").get(empresa);
  res.json({ok:true,fecha:today(),vencidas_actualizadas:vencidas,config,resumen:recurrentSummary(empresa)});
});

r.post("/actualizar-vencidas",requireAuth,requirePermission("cartera.editar"),(req,res)=>{
  const empresa=isAdmin(req.user)&&Number(req.body.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id,cambios=refreshOverdue(empresa);
  audit(req,"ACTUALIZAR_VENCIDAS",`Actualizó ${cambios} factura(s) a Vencida`,empresa);res.json({ok:true,actualizadas:cambios,fecha:today()});
});

r.put("/config",requireAuth,requirePermission("facturas.editar"),(req,res)=>{
  const empresa=isAdmin(req.user)&&Number(req.body.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id;
  const dia=Math.min(28,Math.max(1,Number(req.body.dia_ejecucion||1))),dias=Math.min(365,Math.max(0,Number(req.body.dias_vencimiento||0)));
  const estado=["Borrador","Emitida"].includes(req.body.estado_inicial)?req.body.estado_inicial:"Emitida",activo=Number(req.body.activo)!==0?1:0,upd=req.body.actualizar_vencidas===false?0:1;
  db.prepare(`INSERT INTO facturacion_config(empresa_id,activo,dia_ejecucion,dias_vencimiento,estado_inicial,actualizar_vencidas,fecha_actualizacion) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(empresa_id) DO UPDATE SET activo=excluded.activo,dia_ejecucion=excluded.dia_ejecucion,dias_vencimiento=excluded.dias_vencimiento,estado_inicial=excluded.estado_inicial,actualizar_vencidas=excluded.actualizar_vencidas,fecha_actualizacion=CURRENT_TIMESTAMP`).run(empresa,activo,dia,dias,estado,upd);
  audit(req,"CONFIGURAR_FACTURACION_RECURRENTE","Actualizó configuración de facturación recurrente",empresa);res.json({ok:true,config:db.prepare("SELECT * FROM facturacion_config WHERE empresa_id=?").get(empresa)});
});

r.get("/",requireAuth,requirePermission("facturas.ver"),(req,res)=>{
  const empresa=company(req), periodo=String(req.query.periodo||today().slice(0,7));
  const p=ensurePeriod(empresa,periodo,req.user.id);
  const rows=subscriptionRows(empresa,periodo).map(s=>{const existente=db.prepare("SELECT id,codigo,estado,total FROM facturas WHERE empresa_id=? AND suscripcion_id=? AND periodo_facturacion=?").get(empresa,s.id,periodo);const total=Math.max(0,Number(s.cantidad||1)*Number(s.precio||0)-Number(s.descuento||0));return {...s,total,existente};});
  const lotes=db.prepare(`SELECT l.*,u.nombre usuario FROM facturacion_lotes l LEFT JOIN usuarios u ON u.id=l.creado_por WHERE l.empresa_id=? AND l.periodo_id=? ORDER BY l.id DESC LIMIT 20`).all(empresa,p.id);
  res.json({periodo:p,candidatas:rows,periodos:db.prepare("SELECT * FROM facturacion_periodos WHERE empresa_id=? ORDER BY periodo DESC LIMIT 24").all(empresa),lotes});
});

r.post("/periodos",requireAuth,requirePermission("facturas.editar"),(req,res)=>{const empresa=isAdmin(req.user)&&Number(req.body.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id;try{const p=ensurePeriod(empresa,String(req.body.periodo||""),req.user.id);audit(req,"ABRIR_PERIODO",`Abrió/consultó período ${p.periodo}`,empresa);res.status(201).json({ok:true,periodo:p})}catch(e){res.status(400).json({error:e.message})}});
r.patch("/periodos/:id/cerrar",requireAuth,requirePermission("facturas.editar"),(req,res)=>{const id=Number(req.params.id),p=db.prepare("SELECT * FROM facturacion_periodos WHERE id=?").get(id);if(!p||!allowedCompany(req,p.empresa_id))return res.status(404).json({error:"Período no encontrado"});if(p.estado==="Cerrado")return res.json({ok:true,periodo:p});db.prepare("UPDATE facturacion_periodos SET estado='Cerrado',fecha_cierre=CURRENT_TIMESTAMP,cerrado_por=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id,id);audit(req,"CERRAR_PERIODO",`Cerró período ${p.periodo}`,p.empresa_id);res.json({ok:true,periodo:db.prepare("SELECT * FROM facturacion_periodos WHERE id=?").get(id)})});
r.patch("/periodos/:id/abrir",requireAuth,requirePermission("facturas.editar"),(req,res)=>{const id=Number(req.params.id),p=db.prepare("SELECT * FROM facturacion_periodos WHERE id=?").get(id);if(!p||!allowedCompany(req,p.empresa_id))return res.status(404).json({error:"Período no encontrado"});db.prepare("UPDATE facturacion_periodos SET estado='Abierto',fecha_cierre=NULL,cerrado_por=NULL,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(id);audit(req,"REABRIR_PERIODO",`Reabrió período ${p.periodo}`,p.empresa_id);res.json({ok:true,periodo:db.prepare("SELECT * FROM facturacion_periodos WHERE id=?").get(id)})});

r.post("/generar",requireAuth,requirePermission("facturas.crear"),(req,res)=>{
  const empresa=isAdmin(req.user)&&Number(req.body.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id;const periodo=String(req.body.periodo||"");let p;try{p=ensurePeriod(empresa,periodo,req.user.id)}catch(e){return res.status(400).json({error:e.message})}
  if(p.estado!=="Abierto")return res.status(409).json({error:`El período ${periodo} está Cerrado y no permite generar facturas.`});
  const estadoInicial=["Borrador","Emitida"].includes(req.body.estado_inicial)?req.body.estado_inicial:"Borrador";const dias=Math.max(0,Math.min(365,Number(req.body.dias_vencimiento||0)));const seleccion=Array.isArray(req.body.suscripcion_ids)&&req.body.suscripcion_ids.length?new Set(req.body.suscripcion_ids.map(Number)):null;const candidatas=subscriptionRows(empresa,periodo).filter(s=>!seleccion||seleccion.has(s.id));
  let generated=0,skipped=0;const results=[];
  const tx=db.transaction(()=>{
    const lot=db.prepare("INSERT INTO facturacion_lotes(empresa_id,periodo_id,estado,estado_inicial_factura,dias_vencimiento,creado_por) VALUES(?,?,?,?,?,?)").run(empresa,p.id,"Procesando",estadoInicial,dias,req.user.id);const loteId=Number(lot.lastInsertRowid);
    const insF=db.prepare(`INSERT INTO facturas(empresa_id,cliente_id,cotizacion_id,suscripcion_id,periodo_facturacion,codigo,fecha_emision,fecha_vencimiento,estado,subtotal,descuento,impuestos,total,observaciones,creado_por,fecha_actualizacion) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`);
    const insD=db.prepare("INSERT INTO factura_detalles(factura_id,servicio_id,plan_id,descripcion,cantidad,precio_unitario,descuento,subtotal,orden) VALUES(?,?,?,?,?,?,?,?,?)");
    const insL=db.prepare("INSERT INTO facturacion_lote_detalles(lote_id,suscripcion_id,factura_id,estado,motivo) VALUES(?,?,?,?,?)");
    for(const s of candidatas){const existing=db.prepare("SELECT id,codigo FROM facturas WHERE empresa_id=? AND suscripcion_id=? AND periodo_facturacion=?").get(empresa,s.id,periodo);if(existing){skipped++;insL.run(loteId,s.id,existing.id,"Omitida",`Ya existe la factura ${existing.codigo||existing.id}.`);results.push({suscripcion_id:s.id,estado:"Omitida",factura_id:existing.id});continue;}const total=Math.max(0,Number(s.cantidad||1)*Number(s.precio||0)-Number(s.descuento||0));const subtotal=Math.max(0,Number(s.cantidad||1)*Number(s.precio||0));const emision=dueDate(periodo,s.dia_facturacion,0);const venc=dias?dueDate(periodo,s.dia_facturacion,dias):"";const codigo=nextCode(empresa);const f=insF.run(empresa,s.cliente_id,null,s.id,periodo,codigo,emision,venc,estadoInicial,subtotal,Number(s.descuento||0),0,total,`Facturación recurrente ${periodo} · ${s.plan}`,req.user.id);const fid=Number(f.lastInsertRowid);insD.run(fid,s.servicio_id,s.plan_id,`${s.servicio} — ${s.plan}`,s.cantidad,s.precio,s.descuento,total,1);insL.run(loteId,s.id,fid,"Generada","");generated++;results.push({suscripcion_id:s.id,estado:"Generada",factura_id:fid,codigo,total});}
    db.prepare("UPDATE facturacion_lotes SET estado='Completado',total_candidatas=?,total_generadas=?,total_omitidas=? WHERE id=?").run(candidatas.length,generated,skipped,loteId);return loteId;
  })();
  audit(req,"GENERAR_FACTURACION_RECURRENTE",`Generó lote ${tx} para período ${periodo}: ${generated} generadas, ${skipped} omitidas`,empresa);res.status(201).json({ok:true,lote_id:tx,periodo,estado_inicial:estadoInicial,dias_vencimiento:dias,candidatas:candidatas.length,generadas:generated,omitidas:skipped,resultados:results});
});

r.post("/procesar",requireAuth,requirePermission("facturas.crear"),(req,res)=>{
  const empresa=isAdmin(req.user)&&Number(req.body.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id,periodo=String(req.body.periodo||today().slice(0,7));
  let p;try{p=ensurePeriod(empresa,periodo,req.user.id)}catch(e){return res.status(400).json({error:e.message})}
  const cfg=db.prepare("SELECT * FROM facturacion_config WHERE empresa_id=?").get(empresa)||{activo:1,dias_vencimiento:0,estado_inicial:'Emitida',actualizar_vencidas:1};
  if(!cfg.activo)return res.status(409).json({error:"La facturación recurrente automática está desactivada para esta empresa."});
  if(p.estado!=="Abierto")return res.status(409).json({error:`El período ${periodo} está Cerrado y no permite generar facturas.`});
  const estadoInicial=["Borrador","Emitida"].includes(cfg.estado_inicial)?cfg.estado_inicial:"Emitida",dias=Math.max(0,Math.min(365,Number(cfg.dias_vencimiento||0))),candidatas=subscriptionRows(empresa,periodo);let generated=0,skipped=0;const results=[];
  try{const tx=db.transaction(()=>{const lot=db.prepare("INSERT INTO facturacion_lotes(empresa_id,periodo_id,estado,estado_inicial_factura,dias_vencimiento,creado_por) VALUES(?,?,?,?,?,?)").run(empresa,p.id,"Procesando",estadoInicial,dias,req.user.id),loteId=Number(lot.lastInsertRowid);
    const insF=db.prepare(`INSERT INTO facturas(empresa_id,cliente_id,cotizacion_id,suscripcion_id,periodo_facturacion,codigo,fecha_emision,fecha_vencimiento,estado,subtotal,descuento,impuestos,total,observaciones,creado_por,fecha_actualizacion) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`),insD=db.prepare("INSERT INTO factura_detalles(factura_id,servicio_id,plan_id,descripcion,cantidad,precio_unitario,descuento,subtotal,orden) VALUES(?,?,?,?,?,?,?,?,?)"),insL=db.prepare("INSERT INTO facturacion_lote_detalles(lote_id,suscripcion_id,factura_id,estado,motivo) VALUES(?,?,?,?,?)");
    for(const s of candidatas){const existing=db.prepare("SELECT id,codigo FROM facturas WHERE empresa_id=? AND suscripcion_id=? AND periodo_facturacion=?").get(empresa,s.id,periodo);if(existing){skipped++;insL.run(loteId,s.id,existing.id,"Omitida",`Ya existe la factura ${existing.codigo||existing.id}.`);continue;}const total=Math.max(0,Number(s.cantidad||1)*Number(s.precio||0)-Number(s.descuento||0)),subtotal=Math.max(0,Number(s.cantidad||1)*Number(s.precio||0)),emision=dueDate(periodo,s.dia_facturacion,0),venc=dias?dueDate(periodo,s.dia_facturacion,dias):"",codigo=nextCode(empresa),f=insF.run(empresa,s.cliente_id,null,s.id,periodo,codigo,emision,venc,estadoInicial,subtotal,Number(s.descuento||0),0,total,`Facturación recurrente automática ${periodo} · ${s.plan}`,req.user.id),fid=Number(f.lastInsertRowid);insD.run(fid,s.servicio_id,s.plan_id,`${s.servicio} — ${s.plan}`,s.cantidad,s.precio,s.descuento,total,1);insL.run(loteId,s.id,fid,"Generada","");generated++;results.push({suscripcion_id:s.id,factura_id:fid,codigo,total});}
    db.prepare("UPDATE facturacion_lotes SET estado='Completado',total_candidatas=?,total_generadas=?,total_omitidas=? WHERE id=?").run(candidatas.length,generated,skipped,loteId);db.prepare("UPDATE facturacion_config SET fecha_ultima_ejecucion=CURRENT_TIMESTAMP,fecha_actualizacion=CURRENT_TIMESTAMP WHERE empresa_id=?").run(empresa);return loteId;})();
    const vencidas=cfg.actualizar_vencidas?refreshOverdue(empresa):0;audit(req,"PROCESAR_FACTURACION_AUTOMATICA",`Procesó ${periodo}: ${generated} generadas, ${skipped} omitidas, ${vencidas} vencidas actualizadas`,empresa);res.status(201).json({ok:true,lote_id:tx,periodo,generadas:generated,omitidas:skipped,vencidas_actualizadas:vencidas,resultados:results});
  }catch(e){console.error("[FACTURACION_RECURRENTE] Error automático:",e);res.status(400).json({error:e.message||"No fue posible procesar la facturación recurrente"})}
});

export default r;
