import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { sendNotification } from "../services/notifications.js";
import { todayISO } from "../utils/date.js";
import { assertInvoiceIntegrity } from "../utils/financialIntegrity.js";

const r=Router();
const operationalToday = () => todayISO();
const isAdmin=u=>u.rol==="Administrador";
const selectedCompany=(req)=>isAdmin(req.user)?(Number(req.query.empresa_id)||null):req.user.empresa_id;
function audit(req,accion,detalle,empresaId=req.user.empresa_id){
  try{db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)").run(empresaId,req.user.id,accion,"CARTERA",detalle,req.ip,"OK",req.method,req.originalUrl,req.get("user-agent")||"")}catch(e){}
}
function queryRows(empresa,q="",estado="",clienteId=""){
  const p=[];
  let sql=`SELECT f.id factura_id,f.empresa_id,f.cliente_id,f.codigo,f.fecha_emision,f.fecha_vencimiento,f.estado,f.total,e.nombre empresa,
    COALESCE(c.razon_social,c.nombre_comercial,c.nombre) cliente,
    COALESCE(SUM(CASE WHEN p.estado='Aplicado' THEN p.valor ELSE 0 END),0) pagado,
    MAX(p.fecha_pago) ultimo_pago
    FROM facturas f JOIN empresas e ON e.id=f.empresa_id JOIN clientes c ON c.id=f.cliente_id
    LEFT JOIN pagos_cartera p ON p.factura_id=f.id
    WHERE f.estado NOT IN ('Borrador','Anulada')`;
  if(empresa){sql+=` AND f.empresa_id=?`;p.push(empresa)}
  if(q){sql+=` AND (f.codigo LIKE ? OR c.nombre LIKE ? OR c.razon_social LIKE ? OR c.nombre_comercial LIKE ?)`;const x=`%${q}%`;p.push(x,x,x,x)}
  if(clienteId){sql+=` AND f.cliente_id=?`;p.push(Number(clienteId))}
  sql+=` GROUP BY f.id ORDER BY CASE WHEN f.estado='Vencida' THEN 0 WHEN f.estado='Emitida' THEN 1 ELSE 2 END,f.fecha_vencimiento ASC,f.id DESC`;
  let rows=db.prepare(sql).all(...p).map(x=>{const pagado=Number(x.pagado||0),total=Number(x.total||0),saldo=Math.max(0,total-pagado);let cartera=saldo<=0.009?"Pagada":(x.fecha_vencimiento&&x.fecha_vencimiento<operationalToday()?"Vencida":"Por cobrar");return {...x,pagado,saldo,estado_cartera:cartera}});
  if(estado) rows=rows.filter(x=>x.estado_cartera===estado || (estado==="Pagada"&&x.estado==="Pagada"));
  return rows;
}

r.get("/catalogos",requireAuth,requirePermission("cartera.ver"),(req,res)=>{
  const empresa=selectedCompany(req);
  const clientes=empresa
    ? db.prepare("SELECT id,empresa_id,nombre,razon_social,nombre_comercial FROM clientes WHERE empresa_id=? AND estado=1 ORDER BY COALESCE(razon_social,nombre_comercial,nombre)").all(empresa)
    : db.prepare("SELECT id,empresa_id,nombre,razon_social,nombre_comercial FROM clientes WHERE estado=1 ORDER BY COALESCE(razon_social,nombre_comercial,nombre)").all();
  res.json({clientes});
});

r.get("/",requireAuth,requirePermission("cartera.ver"),(req,res)=>{
  const empresa=selectedCompany(req);const rows=queryRows(empresa,String(req.query.q||"").trim(),String(req.query.estado||""),String(req.query.cliente_id||""));
  const totals=empresa
    ? db.prepare(`SELECT COALESCE(SUM(f.total),0) facturado,
      COALESCE(SUM(CASE WHEN f.estado NOT IN ('Borrador','Anulada') THEN f.total ELSE 0 END),0) facturado_activo
      FROM facturas f WHERE f.empresa_id=?`).get(empresa)
    : db.prepare(`SELECT COALESCE(SUM(f.total),0) facturado,
      COALESCE(SUM(CASE WHEN f.estado NOT IN ('Borrador','Anulada') THEN f.total ELSE 0 END),0) facturado_activo
      FROM facturas f WHERE f.estado NOT IN ('Borrador','Anulada')`).get();
  const pagos=empresa
    ? db.prepare("SELECT COALESCE(SUM(valor),0) cobrado FROM pagos_cartera WHERE empresa_id=? AND estado='Aplicado'").get(empresa)
    : db.prepare("SELECT COALESCE(SUM(valor),0) cobrado FROM pagos_cartera WHERE estado='Aplicado'").get();
  const porCobrar=rows.filter(x=>x.saldo>0).reduce((a,x)=>a+x.saldo,0);
  const vencido=rows.filter(x=>x.estado_cartera==='Vencida').reduce((a,x)=>a+x.saldo,0);
  const clientesConSaldo=new Set(rows.filter(x=>x.saldo>0).map(x=>x.cliente_id)).size;
  res.json({cartera:rows,resumen:{facturado:Number(totals.facturado_activo||0),cobrado:Number(pagos.cobrado||0),por_cobrar:porCobrar,vencido,clientes_con_saldo:clientesConSaldo}});
});

function getInvoice(id){return db.prepare(`SELECT f.*,e.nombre empresa,COALESCE(c.razon_social,c.nombre_comercial,c.nombre) cliente,
 COALESCE((SELECT SUM(valor) FROM pagos_cartera WHERE factura_id=f.id AND estado='Aplicado'),0) pagado
 FROM facturas f JOIN empresas e ON e.id=f.empresa_id JOIN clientes c ON c.id=f.cliente_id WHERE f.id=?`).get(id)}

r.get("/:id",requireAuth,requirePermission("cartera.ver"),(req,res)=>{
  const f=getInvoice(Number(req.params.id));if(!f || (!isAdmin(req.user)&&f.empresa_id!==req.user.empresa_id))return res.status(404).json({error:"Factura no encontrada"});
  const pagado=Number(f.pagado||0),saldo=Math.max(0,Number(f.total||0)-pagado);const estado_cartera=saldo<=0.009?"Pagada":(f.fecha_vencimiento&&f.fecha_vencimiento<operationalToday()?"Vencida":"Por cobrar");
  const pagos=db.prepare("SELECT id,fecha_pago,medio_pago,referencia,valor,estado,observaciones,fecha_creacion FROM pagos_cartera WHERE factura_id=? ORDER BY fecha_pago DESC,id DESC").all(f.id);
  res.json({factura:{...f,pagado,saldo,estado_cartera},pagos});
});

r.post("/:id/pagos",requireAuth,requirePermission("cartera.crear"),(req,res)=>{
  const id=Number(req.params.id),f=getInvoice(id);if(!f || (!isAdmin(req.user)&&f.empresa_id!==req.user.empresa_id))return res.status(404).json({error:"Factura no encontrada"});
  try { assertInvoiceIntegrity(id); } catch (e) { return res.status(409).json({error:e.message}); }
  if(!["Emitida","Vencida"].includes(f.estado))return res.status(409).json({error:"Solo se pueden registrar pagos sobre facturas Emitidas o Vencidas."});
  const pagado=Number(f.pagado||0),saldo=Math.max(0,Number(f.total||0)-pagado),valor=Number(req.body.valor||0);if(valor<=0)return res.status(400).json({error:"El valor del pago debe ser mayor que cero."});if(valor>saldo+0.001)return res.status(400).json({error:`El pago supera el saldo pendiente de ${saldo}.`});
  const fecha=String(req.body.fecha_pago||operationalToday());if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha))return res.status(400).json({error:"La fecha de pago no es válida."});
  try{
    const tx=db.transaction(()=>{const p=db.prepare(`INSERT INTO pagos_cartera(empresa_id,factura_id,cliente_id,fecha_pago,medio_pago,referencia,valor,estado,observaciones,creado_por,fecha_actualizacion) VALUES(?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run(f.empresa_id,f.id,f.cliente_id,fecha,String(req.body.medio_pago||"Otro"),String(req.body.referencia||""),valor,"Aplicado",String(req.body.observaciones||""),req.user.id);const nuevoSaldo=saldo-valor;if(nuevoSaldo<=0.009)db.prepare("UPDATE facturas SET estado='Pagada',fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(f.id);return Number(p.lastInsertRowid)})();
    const cliente=db.prepare("SELECT correo,nombre,nombre_comercial,razon_social FROM clientes WHERE id=? AND empresa_id=?").get(f.cliente_id,f.empresa_id); if(cliente?.correo) sendNotification({empresaId:f.empresa_id,event:"PAGO_REGISTRADO",to:cliente.correo,vars:{nombre:cliente.nombre,cliente:cliente.nombre_comercial||cliente.razon_social||cliente.nombre,empresa:db.prepare("SELECT nombre FROM empresas WHERE id=?").get(f.empresa_id)?.nombre||"",numero:f.codigo,total:f.total,pago:valor}}).catch(e=>console.warn("[NOTIFICACIONES] Pago:",e.message));
    audit(req,"REGISTRAR_PAGO",`Registró pago ${tx} por ${valor} en factura ${f.codigo}`,f.empresa_id);
    res.status(201).json({ok:true,pago_id:tx,estado:nuevoEstado(f.id)});
  }catch(e){console.error("[CARTERA] Error al registrar pago:",e);res.status(400).json({error:e.message||"No fue posible registrar el pago"})}
});
function nuevoEstado(id){const f=getInvoice(id);const saldo=Math.max(0,Number(f.total||0)-Number(f.pagado||0));return saldo<=0.009?"Pagada":f.estado}

export default r;
