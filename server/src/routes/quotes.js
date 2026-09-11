import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { getBrand } from "../services_documentRenderer.js";
import { buildPdf } from "../services_pdf.js";
import { sendNotification } from "../services/notifications.js";

const r = Router();
const isAdmin = (u) => u.rol === "Administrador";

function audit(req, accion, detalle, empresaId = req.user.empresa_id) {
  db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(empresaId, req.user.id, accion, "COTIZACIONES", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent") || "");
}

function quote(id) {
  return db.prepare(`SELECT q.*, e.nombre empresa, c.nombre cliente_nombre, c.razon_social, c.nombre_comercial,
    p.nombre prospecto_nombre, p.nit prospecto_nit, p.contacto prospecto_contacto,
    COALESCE(u.nombre || ' ' || u.apellido, '') responsable_nombre
    FROM cotizaciones q
    JOIN empresas e ON e.id=q.empresa_id
    LEFT JOIN clientes c ON c.id=q.cliente_id
    LEFT JOIN prospectos p ON p.id=q.prospecto_id
    LEFT JOIN usuarios u ON u.id=q.responsable_id
    WHERE q.id=?`).get(id);
}

function allowed(req, row) { return row && (isAdmin(req.user) || row.empresa_id === req.user.empresa_id); }

function normalize(body={}) {
  const fecha=String(body.fecha||"").trim();
  const fechaVencimiento=String(body.fecha_vencimiento||"").trim();
  let vigenciaDias=Math.max(1, Number(body.vigencia_dias||15));
  if(fecha && fechaVencimiento){
    const inicio=new Date(`${fecha}T00:00:00`), fin=new Date(`${fechaVencimiento}T00:00:00`);
    if(!Number.isNaN(inicio.getTime()) && !Number.isNaN(fin.getTime())) vigenciaDias=Math.max(1,Math.round((fin-inicio)/86400000));
  }
  return {
    codigo:String(body.codigo||"").trim(),
    fecha,
    vigencia_dias:vigenciaDias,
    fecha_vencimiento:fechaVencimiento,
    responsable_id:Number(body.responsable_id||0)||null,
    estado:String(body.estado||"Borrador"),
    condiciones:String(body.condiciones||"").trim(),
    observaciones:String(body.observaciones||"").trim()
  };
}

r.get("/catalogos", requireAuth, requirePermission("cotizaciones.ver"), (req,res)=>{
  const empresa = isAdmin(req.user) && Number(req.query.empresa_id) ? Number(req.query.empresa_id) : req.user.empresa_id;
  const existentes=db.prepare("SELECT codigo FROM cotizaciones WHERE empresa_id=? AND codigo<>''").all(empresa);
  let maxNumero=0;
  for(const row of existentes){ const m=String(row.codigo||"").match(/^COT-?(\d+)$/i); if(m) maxNumero=Math.max(maxNumero,Number(m[1])); }
  const siguiente_codigo=`COT${String(maxNumero+1).padStart(4,"0")}`;
  res.json({siguiente_codigo,
    clientes: db.prepare(`SELECT c.id,c.nombre,c.razon_social,c.nombre_comercial,c.empresa_id,
      CASE WHEN EXISTS (SELECT 1 FROM cotizaciones q2 WHERE q2.cliente_id=c.id AND q2.empresa_id=c.empresa_id AND q2.estado<>'Aceptada') THEN 1 ELSE 0 END AS cotizacion_bloqueada,
      (SELECT q3.estado FROM cotizaciones q3 WHERE q3.cliente_id=c.id AND q3.empresa_id=c.empresa_id AND q3.estado<>'Aceptada' ORDER BY q3.id DESC LIMIT 1) AS cotizacion_bloqueo_estado,
      (SELECT q4.codigo FROM cotizaciones q4 WHERE q4.cliente_id=c.id AND q4.empresa_id=c.empresa_id AND q4.estado<>'Aceptada' ORDER BY q4.id DESC LIMIT 1) AS cotizacion_bloqueo_codigo
      FROM clientes c WHERE c.empresa_id=? AND c.estado=1 ORDER BY COALESCE(NULLIF(c.razon_social,''),c.nombre)`).all(empresa),
    prospectos: db.prepare("SELECT id,nombre,nit,contacto,telefono,correo,empresa_id FROM prospectos WHERE empresa_id=? AND estado=1 AND convertido_cliente_id IS NULL ORDER BY nombre").all(empresa),
    servicios: db.prepare("SELECT id,nombre,codigo,precio_base,empresa_id FROM servicios WHERE empresa_id=? AND estado=1 ORDER BY nombre").all(empresa),
    planes: db.prepare("SELECT p.id,p.nombre,p.codigo,p.precio,p.servicio_id,p.empresa_id,s.nombre servicio FROM planes p JOIN servicios s ON s.id=p.servicio_id WHERE p.empresa_id=? AND p.estado=1 ORDER BY p.nombre").all(empresa),
    usuarios: db.prepare("SELECT id,nombre,apellido FROM usuarios WHERE empresa_id=? ORDER BY nombre,apellido").all(empresa)
  });
});

r.get("/export", requireAuth, requirePermission("cotizaciones.exportar"), (req,res)=>{
  const q=String(req.query.q||"").trim(), estado=String(req.query.estado||"");
  const empresa=isAdmin(req.user)&&Number(req.query.empresa_id)?Number(req.query.empresa_id):req.user.empresa_id;
  const params=[empresa];
  let sql=`SELECT q.codigo,COALESCE(c.razon_social,p.nombre) razon_social,COALESCE(c.nombre,p.nombre) cliente,q.fecha,q.vigencia_dias,q.fecha_vencimiento,q.estado,q.subtotal,q.descuento,q.impuestos,q.total,q.condiciones,q.observaciones FROM cotizaciones q LEFT JOIN clientes c ON c.id=q.cliente_id LEFT JOIN prospectos p ON p.id=q.prospecto_id WHERE q.empresa_id=?`;
  if(q){sql+=" AND (q.codigo LIKE ? OR c.nombre LIKE ? OR c.razon_social LIKE ? OR c.nombre_comercial LIKE ? OR p.nombre LIKE ?)";const l=`%${q}%`;params.push(l,l,l,l,l);}
  if(estado){sql+=" AND q.estado=?";params.push(estado);}
  sql+=" ORDER BY q.fecha DESC,q.id DESC";
  const rows=db.prepare(sql).all(...params); const h=Object.keys(rows[0]||{codigo:"",razon_social:"",cliente:"",fecha:"",vigencia_dias:"",fecha_vencimiento:"",estado:"",subtotal:"",descuento:"",impuestos:"",total:"",condiciones:"",observaciones:""});
  const cell=v=>`"${String(v??"").replaceAll('"','""')}"`;
  res.setHeader("Content-Type","text/csv; charset=utf-8");res.setHeader("Content-Disposition",`attachment; filename="cotizaciones-itgps-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send("\ufeff"+[h.join(","),...rows.map(x=>h.map(k=>cell(x[k])).join(","))].join("\n"));
});

r.get("/", requireAuth, requirePermission("cotizaciones.ver"), (req,res)=>{
  const q=String(req.query.q||"").trim(), estado=String(req.query.estado||"");
  const empresa=isAdmin(req.user)&&Number(req.query.empresa_id)?Number(req.query.empresa_id):req.user.empresa_id;
  const params=[empresa];
  let sql=`SELECT q.*,e.nombre empresa,COALESCE(c.nombre,p.nombre) cliente,c.correo,c.razon_social,c.nombre_comercial,p.nombre prospecto_nombre,COALESCE(u.nombre||' '||u.apellido,'') responsable_nombre FROM cotizaciones q JOIN empresas e ON e.id=q.empresa_id LEFT JOIN clientes c ON c.id=q.cliente_id LEFT JOIN prospectos p ON p.id=q.prospecto_id LEFT JOIN usuarios u ON u.id=q.responsable_id WHERE q.empresa_id=?`;
  if(q){sql+=" AND (q.codigo LIKE ? OR c.nombre LIKE ? OR c.razon_social LIKE ? OR c.nombre_comercial LIKE ? OR p.nombre LIKE ?)";const l=`%${q}%`;params.push(l,l,l,l,l);}
  if(estado){sql+=" AND q.estado=?";params.push(estado);}
  sql+=" ORDER BY q.fecha DESC,q.id DESC LIMIT 1000";
  res.json({cotizaciones:db.prepare(sql).all(...params)});
});

r.get("/:id/pdf", requireAuth, requirePermission("cotizaciones.exportar"), (req,res)=>{
  const id=Number(req.params.id), h=quote(id);
  if(!allowed(req,h)) return res.status(404).json({error:"Cotización no encontrada"});
  const detalles=db.prepare(`SELECT d.*,s.nombre servicio,p.nombre plan FROM cotizacion_detalles d LEFT JOIN servicios s ON s.id=d.servicio_id LEFT JOIN planes p ON p.id=d.plan_id WHERE d.cotizacion_id=? ORDER BY d.orden,d.id`).all(id);
  const brand=getBrand(h.empresa_id);
  if(!brand)return res.status(404).json({error:"Empresa no encontrada"});
  const destinatario=h.cliente_nombre||h.razon_social||h.nombre_comercial||h.prospecto_nombre||"Prospecto";
  const rows=detalles.map(d=>({Concepto:d.descripcion||d.plan||d.servicio||"Servicio",Cantidad:d.cantidad,Precio:Number(d.precio_unitario||0).toLocaleString("es-CO"),Descuento:Number(d.descuento||0).toLocaleString("es-CO"),Subtotal:Number(d.subtotal||0).toLocaleString("es-CO")}));
  rows.push({Concepto:`TOTAL — ${destinatario}`,Cantidad:"",Precio:"",Descuento:"",Subtotal:Number(h.total||0).toLocaleString("es-CO")});
  const data={title:`Cotización ${h.codigo}`,columns:["Concepto","Cantidad","Precio","Descuento","Subtotal"],rows,brand:{...brand,texto_legal:`Destinatario: ${destinatario} · Fecha: ${h.fecha} · Vigencia: ${h.fecha_vencimiento||"—"}`}};
  const pdf=buildPdf(data);
  res.setHeader("Content-Type","application/pdf");res.setHeader("Content-Disposition",`attachment; filename="${h.codigo||`cotizacion-${id}`}.pdf"`);res.end(pdf);
});

r.get("/:id", requireAuth, requirePermission("cotizaciones.ver"), (req,res)=>{
  const id=Number(req.params.id), h=quote(id); if(!allowed(req,h))return res.status(404).json({error:"Cotización no encontrada"});
  const detalles=db.prepare(`SELECT d.*,s.nombre servicio,p.nombre plan FROM cotizacion_detalles d LEFT JOIN servicios s ON s.id=d.servicio_id LEFT JOIN planes p ON p.id=d.plan_id WHERE d.cotizacion_id=? ORDER BY d.orden,d.id`).all(id);
  res.json({cotizacion:h,detalles});
});

r.post("/", requireAuth, requirePermission("cotizaciones.crear"), (req,res)=>{
  const d=normalize(req.body), empresa=isAdmin(req.user)&&Number(req.body.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id;
  const clienteId=Number(req.body.cliente_id||0)||null, prospectoId=Number(req.body.prospecto_id||0)||null;
  if((clienteId&&prospectoId)||(!clienteId&&!prospectoId))return res.status(400).json({error:"Seleccione un cliente o un prospecto para la cotización"});
  const cliente=clienteId?db.prepare("SELECT id,empresa_id,estado FROM clientes WHERE id=?").get(clienteId):null;
  const prospecto=prospectoId?db.prepare("SELECT id,empresa_id,estado,convertido_cliente_id FROM prospectos WHERE id=?").get(prospectoId):null;
  if(clienteId && (!cliente||cliente.empresa_id!==empresa||!cliente.estado))return res.status(400).json({error:"El cliente seleccionado no es válido"});
  if(prospectoId && (!prospecto||prospecto.empresa_id!==empresa||!prospecto.estado||prospecto.convertido_cliente_id))return res.status(400).json({error:"El prospecto seleccionado no es válido"});
  if(!d.fecha)return res.status(400).json({error:"La fecha es obligatoria"});
  if(!d.fecha_vencimiento)return res.status(400).json({error:"La fecha de vencimiento es obligatoria"});
  if(new Date(`${d.fecha_vencimiento}T00:00:00`) < new Date(`${d.fecha}T00:00:00`))return res.status(400).json({error:"La fecha de vencimiento no puede ser anterior a la fecha de la cotización"});
  const bloqueoNueva=clienteId
    ? db.prepare("SELECT id,codigo,estado FROM cotizaciones WHERE cliente_id=? AND empresa_id=? AND estado<>? ORDER BY id DESC LIMIT 1").get(clienteId,empresa,"Aceptada")
    : db.prepare("SELECT id,codigo,estado FROM cotizaciones WHERE prospecto_id=? AND empresa_id=? AND estado<>? ORDER BY id DESC LIMIT 1").get(prospectoId,empresa,"Aceptada");
  if(bloqueoNueva)return res.status(409).json({error:`El cliente ya tiene la cotización ${bloqueoNueva.codigo||bloqueoNueva.id} en estado ${bloqueoNueva.estado}. Debe cerrar o cambiar el estado de esa cotización antes de crear una nueva.`});
  const quoteItems=Array.isArray(req.body.detalles)?req.body.detalles:[];
  if(!quoteItems.length)return res.status(400).json({error:"Agregue al menos un ítem a la cotización"});
  try{
    const tx=db.transaction(()=>{
      const normalizedItems=quoteItems.map((x,i)=>{
        const servicioId=Number(x.servicio_id||0)||null, planId=Number(x.plan_id||0)||null;
        const cantidad=Math.max(1,Number(x.cantidad||1)), precio=Math.max(0,Number(x.precio_unitario||0)), desc=Math.max(0,Number(x.descuento||0));
        const descripcion=String(x.descripcion||"").trim();
        if(!Number.isFinite(cantidad)||!Number.isFinite(precio)||!Number.isFinite(desc)) throw new Error(`El ítem ${i+1} contiene un valor numérico inválido`);
        if(!servicioId&&!planId&&!descripcion) throw new Error(`El ítem ${i+1} debe tener servicio, plan o descripción`);
        if(servicioId){const svc=db.prepare("SELECT id FROM servicios WHERE id=? AND empresa_id=? AND estado=1").get(servicioId,empresa);if(!svc)throw new Error(`El servicio del ítem ${i+1} no es válido para la empresa seleccionada`);}
        if(planId){const pl=db.prepare("SELECT id,servicio_id FROM planes WHERE id=? AND empresa_id=? AND estado=1").get(planId,empresa);if(!pl)throw new Error(`El plan del ítem ${i+1} no es válido para la empresa seleccionada`);if(servicioId&&Number(pl.servicio_id)!==servicioId)throw new Error(`El plan del ítem ${i+1} no corresponde al servicio seleccionado`);}
        return {servicioId,planId,descripcion,cantidad,precio,desc,sub:Math.max(0,cantidad*precio-desc)};
      });
      const subtotal=normalizedItems.reduce((a,x)=>a+x.sub,0);
      const descuento=Math.max(0,Number(req.body.descuento||0));
      const impuestos=Math.max(0,Number(req.body.impuestos||0));
      if(!Number.isFinite(descuento)||!Number.isFinite(impuestos)) throw new Error("Descuento o impuestos no válidos");
      const total=Math.max(0,subtotal-descuento+impuestos);
      // El código de cotización es siempre automático y único por empresa.
      const existentes=db.prepare("SELECT codigo FROM cotizaciones WHERE empresa_id=? AND codigo<>''").all(empresa);
      let maxNumero=0;
      for(const row of existentes){
        const m=String(row.codigo||"").match(/^COT-?(\d+)$/i);
        if(m) maxNumero=Math.max(maxNumero,Number(m[1]));
      }
      const codigo=`COT${String(maxNumero+1).padStart(4,"0")}`;
      const r0=db.prepare(`INSERT INTO cotizaciones(empresa_id,cliente_id,prospecto_id,codigo,fecha,vigencia_dias,fecha_vencimiento,responsable_id,estado,subtotal,descuento,impuestos,total,condiciones,observaciones,creado_por,fecha_actualizacion) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run(empresa,clienteId,prospectoId,codigo,d.fecha,d.vigencia_dias,d.fecha_vencimiento,d.responsable_id,d.estado,subtotal,descuento,impuestos,total,d.condiciones,d.observaciones,req.user.id);
      const ins=db.prepare(`INSERT INTO cotizacion_detalles(cotizacion_id,servicio_id,plan_id,descripcion,cantidad,precio_unitario,descuento,subtotal,orden) VALUES(?,?,?,?,?,?,?,?,?)`);
      normalizedItems.forEach((x,i)=>ins.run(Number(r0.lastInsertRowid),x.servicioId,x.planId,x.descripcion,x.cantidad,x.precio,x.desc,x.sub,i+1));
      return {id:Number(r0.lastInsertRowid),codigo,subtotal,descuento,impuestos,total};
    })();
    try { audit(req,"CREAR",`Creó cotización ${tx.codigo}`,empresa); } catch (auditError) { console.warn("[COTIZACIONES] Auditoría omitida:", auditError.message); }
    let saved;
    try {
      saved = quote(tx.id);
    } catch (readError) {
      console.warn("[COTIZACIONES] No fue posible reconstruir la ficha recién creada:", readError.message);
    }
    saved = saved || {
      id: tx.id,
      codigo: tx.codigo,
      empresa_id: empresa,
      cliente_id: clienteId,
      prospecto_id: prospectoId,
      fecha: d.fecha,
      fecha_vencimiento: d.fecha_vencimiento,
      estado: d.estado,
      subtotal: tx.subtotal,
      descuento: tx.descuento,
      impuestos: tx.impuestos,
      total: tx.total,
      condiciones: d.condiciones,
      observaciones: d.observaciones
    };
res.status(201).json({ok:true,id:Number(tx.id),codigo:String(tx.codigo),cotizacion:saved});
  }catch(e){
    if(String(e.message).includes("UNIQUE"))return res.status(409).json({error:"Ya existe una cotización con ese código en la empresa"});
    console.error("[COTIZACIONES] Error al crear:",e);
    res.status(400).json({error:e.message||"No fue posible crear la cotización"});
  }
});

r.put("/:id", requireAuth, requirePermission("cotizaciones.editar"), (req,res)=>{
  const id=Number(req.params.id), cur=quote(id); if(!allowed(req,cur))return res.status(404).json({error:"Cotización no encontrada"});
  if(cur.estado==="Aceptada")return res.status(409).json({error:"La cotización está Aceptada y no puede ser editada."});
  const d=normalize(req.body), quoteItems=Array.isArray(req.body.detalles)?req.body.detalles:[];
  if(!d.fecha||!d.fecha_vencimiento||!quoteItems.length)return res.status(400).json({error:"Fecha, vencimiento e ítems son obligatorios"});
  if(new Date(`${d.fecha_vencimiento}T00:00:00`) < new Date(`${d.fecha}T00:00:00`))return res.status(400).json({error:"La fecha de vencimiento no puede ser anterior a la fecha de la cotización"});
  const clienteId=Number(req.body.cliente_id||0)||null, prospectoId=Number(req.body.prospecto_id||0)||null;
  if((clienteId&&prospectoId)||(!clienteId&&!prospectoId))return res.status(400).json({error:"Seleccione un cliente o un prospecto para la cotización"});
  const clienteEdit=clienteId?db.prepare("SELECT id,empresa_id,estado FROM clientes WHERE id=?").get(clienteId):null;
  const prospectoEdit=prospectoId?db.prepare("SELECT id,empresa_id,estado,convertido_cliente_id FROM prospectos WHERE id=?").get(prospectoId):null;
  if(clienteId && (!clienteEdit||clienteEdit.empresa_id!==cur.empresa_id||!clienteEdit.estado))return res.status(400).json({error:"El cliente seleccionado no es válido"});
  if(prospectoId && (!prospectoEdit||prospectoEdit.empresa_id!==cur.empresa_id||!prospectoEdit.estado||prospectoEdit.convertido_cliente_id))return res.status(400).json({error:"El prospecto seleccionado no es válido"});
  const otroBloqueo=clienteId
    ? db.prepare("SELECT id,codigo,estado FROM cotizaciones WHERE cliente_id=? AND empresa_id=? AND id<>? AND estado<>? ORDER BY id DESC LIMIT 1").get(clienteId,cur.empresa_id,id,"Aceptada")
    : db.prepare("SELECT id,codigo,estado FROM cotizaciones WHERE prospecto_id=? AND empresa_id=? AND id<>? AND estado<>? ORDER BY id DESC LIMIT 1").get(prospectoId,cur.empresa_id,id,"Aceptada");
  if(otroBloqueo)return res.status(409).json({error:`El cliente ya tiene la cotización ${otroBloqueo.codigo||otroBloqueo.id} en estado ${otroBloqueo.estado}. No puede quedar más de una cotización abierta para el mismo cliente.`});
  try{
    const tx=db.transaction(()=>{
      const subtotal=quoteItems.reduce((a,x)=>{const cantidad=Math.max(1,Number(x.cantidad||1)),precio=Math.max(0,Number(x.precio_unitario||0)),desc=Math.max(0,Number(x.descuento||0));return a+Math.max(0,cantidad*precio-desc)},0), descuento=Math.max(0,Number(req.body.descuento||0)), impuestos=Math.max(0,Number(req.body.impuestos||0)), total=Math.max(0,subtotal-descuento+impuestos);
      db.prepare(`UPDATE cotizaciones SET cliente_id=?,prospecto_id=?,codigo=?,fecha=?,vigencia_dias=?,fecha_vencimiento=?,responsable_id=?,estado=?,subtotal=?,descuento=?,impuestos=?,total=?,condiciones=?,observaciones=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`).run(clienteId,prospectoId,cur.codigo,d.fecha,d.vigencia_dias,d.fecha_vencimiento,d.responsable_id,d.estado,subtotal,descuento,impuestos,total,d.condiciones,d.observaciones,id);
      db.prepare("DELETE FROM cotizacion_detalles WHERE cotizacion_id=?").run(id); const ins=db.prepare(`INSERT INTO cotizacion_detalles(cotizacion_id,servicio_id,plan_id,descripcion,cantidad,precio_unitario,descuento,subtotal,orden) VALUES(?,?,?,?,?,?,?,?,?)`); quoteItems.forEach((x,i)=>{const cantidad=Math.max(1,Number(x.cantidad||1)),precio=Math.max(0,Number(x.precio_unitario||0)),desc=Math.max(0,Number(x.descuento||0));ins.run(id,Number(x.servicio_id||0)||null,Number(x.plan_id||0)||null,String(x.descripcion||"").trim(),cantidad,precio,desc,Math.max(0,cantidad*precio-desc),i+1);});
    });
    audit(req,"EDITAR",`Editó cotización ${id}`,cur.empresa_id);res.json({ok:true,id,codigo:cur.codigo,cotizacion:quote(id)});
  }catch(e){res.status(400).json({error:e.message||"No fue posible actualizar la cotización"});}
});

r.patch("/:id/estado", requireAuth, requirePermission("cotizaciones.editar"), (req,res)=>{
  const id=Number(req.params.id),cur=quote(id); if(!allowed(req,cur))return res.status(404).json({error:"Cotización no encontrada"});
  const estados=["Borrador","Enviada","Aceptada","Rechazada","Vencida"], estado=String(req.body.estado||"");
  if(!estados.includes(estado))return res.status(400).json({error:"Estado de cotización no válido"});
  db.prepare("UPDATE cotizaciones SET estado=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(estado,id);
  audit(req,"CAMBIAR_ESTADO",`Cambió cotización ${id} a ${estado}`,cur.empresa_id); if((estado==="Enviada"||estado==="Aceptada")&&cur.cliente_id){ const email=db.prepare("SELECT correo,nombre,nombre_comercial,razon_social FROM clientes WHERE id=? AND empresa_id=?").get(cur.cliente_id,cur.empresa_id); if(email?.correo){ const detalles=db.prepare(`SELECT d.*,s.nombre servicio,p.nombre plan FROM cotizacion_detalles d LEFT JOIN servicios s ON s.id=d.servicio_id LEFT JOIN planes p ON p.id=d.plan_id WHERE d.cotizacion_id=? ORDER BY d.orden,d.id`).all(id); const brand=getBrand(cur.empresa_id); const rows=detalles.map(d=>({Concepto:d.descripcion||d.plan||d.servicio||"Servicio",Cantidad:d.cantidad,Precio:Number(d.precio_unitario||0).toLocaleString("es-CO"),Descuento:Number(d.descuento||0).toLocaleString("es-CO"),Subtotal:Number(d.subtotal||0).toLocaleString("es-CO")})); rows.push({Concepto:`TOTAL — ${email.nombre_comercial||email.razon_social||email.nombre||"Cliente"}`,Cantidad:"",Precio:"",Descuento:"",Subtotal:Number(cur.total||0).toLocaleString("es-CO")}); const pdf=buildPdf({title:`Cotización ${cur.codigo}`,columns:["Concepto","Cantidad","Precio","Descuento","Subtotal"],rows,brand:{...brand,texto_legal:`Destinatario: ${email.nombre_comercial||email.razon_social||email.nombre||"Cliente"} · Fecha: ${cur.fecha} · Vigencia: ${cur.fecha_vencimiento||"—"}`}}); sendNotification({empresaId:cur.empresa_id,event:estado==="Aceptada"?"COTIZACION_ACEPTADA":"COTIZACION_CREADA",to:email.correo,vars:{cliente:email.nombre_comercial||email.razon_social||email.nombre||"Cliente",numero:cur.codigo,total:cur.total,empresa:cur.empresa||""},attachments:[{filename:`${cur.codigo||`cotizacion-${id}`}.pdf`,content:pdf,contentType:"application/pdf"}]}).catch(e=>console.warn("[NOTIFICACIONES] Cotización:",e.message)); } } res.json({ok:true,estado});
});

r.post("/:id/enviar-email", requireAuth, requirePermission("cotizaciones.exportar"), async (req,res)=>{
  const id=Number(req.params.id), h=quote(id); if(!allowed(req,h))return res.status(404).json({error:"Cotización no encontrada"});
  const email=db.prepare("SELECT correo,nombre,nombre_comercial,razon_social FROM clientes WHERE id=? AND empresa_id=?").get(h.cliente_id,h.empresa_id);
  const to=String(req.body?.destinatario||email?.correo||"").trim(); if(!to)return res.status(400).json({error:"El cliente no tiene correo. Indique un destinatario."});
  const detalles=db.prepare(`SELECT d.*,s.nombre servicio,p.nombre plan FROM cotizacion_detalles d LEFT JOIN servicios s ON s.id=d.servicio_id LEFT JOIN planes p ON p.id=d.plan_id WHERE d.cotizacion_id=? ORDER BY d.orden,d.id`).all(id);
  const brand=getBrand(h.empresa_id); if(!brand)return res.status(404).json({error:"Empresa no encontrada"});
  const cliente=email?.nombre_comercial||email?.razon_social||email?.nombre||h.cliente_nombre||h.prospecto_nombre||"Cliente";
  const rows=detalles.map(d=>({Concepto:d.descripcion||d.plan||d.servicio||"Servicio",Cantidad:d.cantidad,Precio:Number(d.precio_unitario||0).toLocaleString("es-CO"),Descuento:Number(d.descuento||0).toLocaleString("es-CO"),Subtotal:Number(d.subtotal||0).toLocaleString("es-CO")}));
  rows.push({Concepto:`TOTAL — ${cliente}`,Cantidad:"",Precio:"",Descuento:"",Subtotal:Number(h.total||0).toLocaleString("es-CO")});
  const pdf=buildPdf({title:`Cotización ${h.codigo}`,columns:["Concepto","Cantidad","Precio","Descuento","Subtotal"],rows,brand:{...brand,texto_legal:`Destinatario: ${cliente} · Fecha: ${h.fecha} · Vigencia: ${h.fecha_vencimiento||"—"}`}});
  try{const result=await sendNotification({empresaId:h.empresa_id,event:"COTIZACION_CREADA",to,vars:{cliente,numero:h.codigo,total:h.total,empresa:h.empresa||""},attachments:[{filename:`${h.codigo||`cotizacion-${id}`}.pdf`,content:pdf,contentType:"application/pdf"}]}); if(!result.ok)return res.status(400).json({error:result.error||result.message||"No fue posible enviar la cotización"}); db.prepare("UPDATE cotizaciones SET estado=CASE WHEN estado='Borrador' THEN 'Enviada' ELSE estado END,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(id); audit(req,"ENVIAR_EMAIL",`Envió cotización ${h.codigo} por correo`,h.empresa_id); res.json({ok:true,estado:h.estado==='Borrador'?'Enviada':h.estado});}catch(e){res.status(400).json({error:e.message||"No fue posible enviar la cotización"})}
});

r.delete("/:id", requireAuth, requirePermission("cotizaciones.eliminar"), (req,res)=>{
  const id=Number(req.params.id),cur=quote(id);if(!allowed(req,cur))return res.status(404).json({error:"Cotización no encontrada"});
  const next=cur.estado==="Borrador"?"Enviada":cur.estado==="Enviada"?"Borrador":"Borrador";
  db.prepare("UPDATE cotizaciones SET estado=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(next,id);audit(req,next==="Enviada"?"ENVIAR":"REABRIR",`Cambió estado de cotización ${id} a ${next}`,cur.empresa_id);res.json({ok:true,estado:next});
});

export default r;
