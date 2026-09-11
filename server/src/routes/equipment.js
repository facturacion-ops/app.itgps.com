import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const r=Router();
const isAdmin=u=>u.rol==="Administrador";

function company(id){return db.prepare("SELECT id,nombre,nit FROM empresas WHERE id=? AND estado=1").get(id)}
function getEquipo(id){
 return db.prepare(`SELECT e.*,emp.nombre empresa,emp.nit,
   a.codigo activo_codigo,a.placa,a.tipo_activo activo_tipo,c.nombre cliente
   FROM equipos e JOIN empresas emp ON emp.id=e.empresa_id
   LEFT JOIN activos a ON a.id=e.activo_id
   LEFT JOIN clientes c ON c.id=a.cliente_id
   WHERE e.id=?`).get(id);
}
function catalogs(req,res){
 const requested=Number(req.query.empresa_id||0);
 let empresaId=isAdmin(req.user)?requested:req.user.empresa_id;
 if(isAdmin(req.user)&&!empresaId){
   return res.json({empresas:db.prepare("SELECT id,nombre,nit FROM empresas WHERE estado=1 ORDER BY nombre").all(),activos:[]});
 }
 if(!company(empresaId))return res.status(400).json({error:"Empresa no válida o inactiva"});
 const empresas=isAdmin(req.user)?db.prepare("SELECT id,nombre,nit FROM empresas WHERE estado=1 ORDER BY nombre").all():[company(empresaId)];
 const activos=db.prepare(`SELECT a.id,a.codigo,a.placa,a.tipo_activo AS tipo,a.estado,c.nombre cliente
   FROM activos a LEFT JOIN clientes c ON c.id=a.cliente_id
   WHERE a.empresa_id=? AND a.estado<>'Retirado'
   ORDER BY COALESCE(NULLIF(a.placa,''),a.codigo)`).all(empresaId);
 res.json({empresas,activos});
}
r.get("/catalogos",requireAuth,requirePermission("equipos.ver"),catalogs);

r.get("/",requireAuth,requirePermission("equipos.ver"),(req,res)=>{
 const empresaId=isAdmin(req.user)&&Number(req.query.empresa_id)?Number(req.query.empresa_id):req.user.empresa_id;
 const q=String(req.query.q||"").trim(),estado=String(req.query.estado||"").trim(),params=[empresaId];
 let sql=`SELECT e.id,e.empresa_id,e.activo_id,e.codigo,e.imei,e.numero_serie,e.fabricante,e.marca,e.modelo,
 e.tipo_dispositivo,e.estado,e.firmware,e.protocolo,e.fecha_compra,e.fecha_instalacion,e.fecha_garantia,
 e.observaciones,emp.nombre empresa,a.codigo activo_codigo,a.placa,a.tipo_activo activo_tipo,c.nombre cliente
 FROM equipos e JOIN empresas emp ON emp.id=e.empresa_id LEFT JOIN activos a ON a.id=e.activo_id
 LEFT JOIN clientes c ON c.id=a.cliente_id WHERE e.empresa_id=?`;
 if(q){
   sql+=` AND (e.codigo LIKE ? OR e.imei LIKE ? OR e.numero_serie LIKE ? OR e.fabricante LIKE ?
   OR e.marca LIKE ? OR e.modelo LIKE ? OR a.placa LIKE ? OR a.codigo LIKE ? OR c.nombre LIKE ?)`;
   const l=`%${q}%`;for(let i=0;i<9;i++)params.push(l);
 }
 if(estado){sql+=" AND e.estado=?";params.push(estado)}
 sql+=" ORDER BY e.estado,e.imei LIMIT 2000";
 res.json({equipos:db.prepare(sql).all(...params)});
});


r.get("/export",requireAuth,requirePermission("equipos.exportar"),(req,res)=>{
 const empresaId=isAdmin(req.user)&&Number(req.query.empresa_id)?Number(req.query.empresa_id):req.user.empresa_id;
 const q=String(req.query.q||"").trim(),estado=String(req.query.estado||"").trim(),params=[empresaId];
 let sql=`SELECT e.codigo,e.imei,e.numero_serie,e.fabricante,e.marca,e.modelo,e.tipo_dispositivo,e.estado,e.firmware,e.protocolo,
 e.fecha_compra,e.fecha_instalacion,e.fecha_garantia,e.observaciones,emp.nombre empresa,a.codigo activo_codigo,a.placa,c.nombre cliente
 FROM equipos e JOIN empresas emp ON emp.id=e.empresa_id LEFT JOIN activos a ON a.id=e.activo_id
 LEFT JOIN clientes c ON c.id=a.cliente_id WHERE e.empresa_id=?`;
 if(q){sql+=` AND (e.codigo LIKE ? OR e.imei LIKE ? OR e.numero_serie LIKE ? OR e.fabricante LIKE ? OR e.marca LIKE ? OR e.modelo LIKE ? OR a.placa LIKE ? OR a.codigo LIKE ? OR c.nombre LIKE ?)`;
   const l=`%${q}%`;for(let i=0;i<9;i++)params.push(l)}
 if(estado){sql+=" AND e.estado=?";params.push(estado)}
 const rows=db.prepare(sql+" ORDER BY e.estado,e.imei").all(...params);
 const h=["codigo","imei","numero_serie","fabricante","marca","modelo","tipo_dispositivo","estado","firmware","protocolo","fecha_compra","fecha_instalacion","fecha_garantia","observaciones","empresa","activo_codigo","placa","cliente"];
 const cell=v=>`"${String(v??"").replaceAll('"','""')}"`;
 const csv=[h.join(","),...rows.map(x=>h.map(k=>cell(x[k])).join(","))].join("\n");
 res.setHeader("Content-Type","text/csv; charset=utf-8");
 res.setHeader("Content-Disposition",`attachment; filename="equipos-gps-itgps-${new Date().toISOString().slice(0,10)}.csv"`);
 res.send("\ufeff"+csv)
});

r.get("/:id",requireAuth,requirePermission("equipos.ver"),(req,res)=>{
 const x=getEquipo(Number(req.params.id));
 if(!x)return res.status(404).json({error:"Equipo GPS no encontrado"});
 if(!isAdmin(req.user)&&x.empresa_id!==req.user.empresa_id)return res.status(404).json({error:"Equipo GPS no encontrado"});
 res.json({equipo:x});
});

function normalize(b={}){
 return {
  codigo:String(b.codigo||"").trim(),imei:String(b.imei||"").replace(/\s+/g,"").trim(),
  numero_serie:String(b.numero_serie||"").trim(),fabricante:String(b.fabricante||"").trim(),
  marca:String(b.marca||"").trim(),modelo:String(b.modelo||"").trim(),
  tipo_dispositivo:String(b.tipo_dispositivo||"").trim(),estado:String(b.estado||"Disponible").trim(),
  firmware:String(b.firmware||"").trim(),protocolo:String(b.protocolo||"").trim(),
  fecha_compra:String(b.fecha_compra||"").trim(),fecha_instalacion:String(b.fecha_instalacion||"").trim(),
  fecha_garantia:String(b.fecha_garantia||"").trim(),observaciones:String(b.observaciones||"").trim()
 };
}
function audit(req,accion,detalle,empresaId){
 const q=db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)");
 q.run(empresaId,req.user.id,accion,"EQUIPOS",detalle,req.ip,"OK",req.method,req.originalUrl,req.get("user-agent")||"");
}

r.post("/",requireAuth,requirePermission("equipos.crear"),(req,res)=>{
 const d=normalize(req.body);
 if(!d.imei||!/^\d{10,20}$/.test(d.imei))return res.status(400).json({error:"El IMEI debe contener entre 10 y 20 dígitos"});
 const empresaId=isAdmin(req.user)&&Number(req.body?.empresa_id)?Number(req.body.empresa_id):req.user.empresa_id;
 if(!company(empresaId))return res.status(400).json({error:"Empresa no válida o inactiva"});
 const activoId=Number(req.body?.activo_id||0);
 if(activoId){
  const a=db.prepare("SELECT id FROM activos WHERE id=? AND empresa_id=? AND estado<>'Retirado'").get(activoId,empresaId);
  if(!a)return res.status(400).json({error:"Activo no válido para la empresa seleccionada"});
 }
 if(db.prepare("SELECT id FROM equipos WHERE imei=?").get(d.imei))return res.status(409).json({error:"El IMEI ya está registrado"});
 try{
  const x=db.prepare(`INSERT INTO equipos(empresa_id,activo_id,codigo,imei,numero_serie,fabricante,marca,modelo,tipo_dispositivo,estado,
   firmware,protocolo,fecha_compra,fecha_instalacion,fecha_garantia,observaciones,creado_por)
   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(empresaId,activoId||null,d.codigo,d.imei,d.numero_serie,d.fabricante,d.marca,d.modelo,d.tipo_dispositivo,d.estado,
   d.firmware,d.protocolo,d.fecha_compra,d.fecha_instalacion,d.fecha_garantia,d.observaciones,req.user.id);
  audit(req,"CREAR",`Creó equipo GPS IMEI ${d.imei}`,empresaId);
  res.status(201).json({ok:true,id:Number(x.lastInsertRowid)});
 }catch(e){res.status(409).json({error:"No fue posible crear el equipo GPS"})}
});

r.put("/:id",requireAuth,requirePermission("equipos.editar"),(req,res)=>{
 const id=Number(req.params.id),cur=getEquipo(id);
 if(!cur)return res.status(404).json({error:"Equipo GPS no encontrado"});
 if(!isAdmin(req.user)&&cur.empresa_id!==req.user.empresa_id)return res.status(404).json({error:"Equipo GPS no encontrado"});
 const d=normalize(req.body);
 if(!d.imei||!/^\d{10,20}$/.test(d.imei))return res.status(400).json({error:"El IMEI debe contener entre 10 y 20 dígitos"});
 const empresaId=isAdmin(req.user)&&Number(req.body?.empresa_id)?Number(req.body.empresa_id):cur.empresa_id;
 if(!company(empresaId))return res.status(400).json({error:"Empresa no válida o inactiva"});
 const activoId=Number(req.body?.activo_id||0);
 if(activoId){
  const a=db.prepare("SELECT id FROM activos WHERE id=? AND empresa_id=? AND estado<>'Retirado'").get(activoId,empresaId);
  if(!a)return res.status(400).json({error:"Activo no válido para la empresa seleccionada"});
 }
 const dup=db.prepare("SELECT id FROM equipos WHERE imei=? AND id<>?").get(d.imei,id);
 if(dup)return res.status(409).json({error:"El IMEI ya está registrado en otro equipo"});
 db.prepare(`UPDATE equipos SET empresa_id=?,activo_id=?,codigo=?,imei=?,numero_serie=?,fabricante=?,marca=?,modelo=?,tipo_dispositivo=?,estado=?,
 firmware=?,protocolo=?,fecha_compra=?,fecha_instalacion=?,fecha_garantia=?,observaciones=?,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?`)
 .run(empresaId,activoId||null,d.codigo,d.imei,d.numero_serie,d.fabricante,d.marca,d.modelo,d.tipo_dispositivo,d.estado,d.firmware,d.protocolo,
 d.fecha_compra,d.fecha_instalacion,d.fecha_garantia,d.observaciones,id);
 audit(req,"EDITAR",`Editó equipo GPS ID ${id} - IMEI ${d.imei}`,empresaId);
 res.json({ok:true});
});

r.delete("/:id",requireAuth,requirePermission("equipos.eliminar"),(req,res)=>{
 const id=Number(req.params.id),cur=getEquipo(id);
 if(!cur)return res.status(404).json({error:"Equipo GPS no encontrado"});
 if(!isAdmin(req.user)&&cur.empresa_id!==req.user.empresa_id)return res.status(404).json({error:"Equipo GPS no encontrado"});
 db.prepare("UPDATE equipos SET estado='Retirado',activo_id=NULL,fecha_actualizacion=CURRENT_TIMESTAMP WHERE id=?").run(id);
 audit(req,"RETIRAR",`Retiró equipo GPS ID ${id} - IMEI ${cur.imei}`,cur.empresa_id);
 res.json({ok:true});
});
export default r;
