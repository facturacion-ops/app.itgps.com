import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js"; import {securityConfig,passwordPolicyError} from "../services/security.js"; import { sendNotification } from "../services/notifications.js";

const r = Router();
const isAdmin = (u) => u.rol === "Administrador";
const pub = (u) => ({ id:u.id, empresa_id:u.empresa_id, empresa:u.empresa, rol_id:u.rol_id, rol:u.rol, nombre:u.nombre, apellido:u.apellido, correo:u.correo, estado:u.estado, ultimo_login:u.ultimo_login, fecha_creacion:u.fecha_creacion });
function audit(req, accion, detalle) { db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)").run(req.user.empresa_id,req.user.id,accion,"USUARIOS",detalle,req.ip,"OK",req.method,req.originalUrl,req.get("user-agent")||""); }

r.get("/", requireAuth, requirePermission("usuarios.ver"), (req,res)=>{
  const sql = isAdmin(req.user)
    ? "SELECT u.*,e.nombre empresa,r.nombre rol FROM usuarios u JOIN empresas e ON e.id=u.empresa_id JOIN roles r ON r.id=u.rol_id ORDER BY e.nombre,u.nombre,u.apellido"
    : "SELECT u.*,e.nombre empresa,r.nombre rol FROM usuarios u JOIN empresas e ON e.id=u.empresa_id JOIN roles r ON r.id=u.rol_id WHERE u.empresa_id=? ORDER BY u.nombre,u.apellido";
  const users = isAdmin(req.user) ? db.prepare(sql).all() : db.prepare(sql).all(req.user.empresa_id);
  res.json({ usuarios: users.map(pub) });
});

r.get("/catalogos", requireAuth, requirePermission("usuarios.ver"), (req,res)=>{
  const empresas = isAdmin(req.user) ? db.prepare("SELECT id,nombre,nit,estado FROM empresas WHERE estado=1 ORDER BY nombre").all() : db.prepare("SELECT id,nombre,nit,estado FROM empresas WHERE id=?").all(req.user.empresa_id);
  res.json({ roles:db.prepare("SELECT id,nombre FROM roles WHERE estado=1 ORDER BY nombre").all(), empresas });
});

r.post("/", requireAuth, requirePermission("usuarios.crear"), (req,res)=>{
  const {nombre,apellido="",correo,password,rol_id}=req.body||{};
  const empresa_id = isAdmin(req.user) && req.body?.empresa_id ? Number(req.body.empresa_id) : req.user.empresa_id;
  if(!nombre||!correo||!password||!rol_id||!empresa_id) return res.status(400).json({error:"Nombre, correo, contraseña, rol y empresa son obligatorios"}); const policyError=passwordPolicyError(password,securityConfig(empresa_id)); if(policyError)return res.status(400).json({error:policyError});
  if(!db.prepare("SELECT id FROM empresas WHERE id=? AND estado=1").get(empresa_id)) return res.status(400).json({error:"Empresa no válida"});
  if(db.prepare("SELECT id FROM usuarios WHERE empresa_id=? AND lower(correo)=lower(?)").get(empresa_id,correo.trim())) return res.status(409).json({error:"El correo ya existe en esta empresa"});
  const id=db.prepare("INSERT INTO usuarios(empresa_id,rol_id,nombre,apellido,correo,password_hash) VALUES(?,?,?,?,?,?)").run(empresa_id,Number(rol_id),nombre.trim(),apellido.trim(),correo.trim(),bcrypt.hashSync(password,12)).lastInsertRowid;
  audit(req,"CREAR",`Creó usuario ${correo} en empresa ${empresa_id}`); sendNotification({empresaId:empresa_id,event:"USUARIO_CREADO",to:correo,vars:{nombre:nombre.trim(),empresa:db.prepare("SELECT nombre FROM empresas WHERE id=?").get(empresa_id)?.nombre||""}}).catch(e=>console.warn("[NOTIFICACIONES] Usuario:",e.message)); res.status(201).json({ok:true,id:Number(id)});
});

r.put("/:id", requireAuth, requirePermission("usuarios.editar"), (req,res)=>{
  const id=Number(req.params.id), {nombre,apellido="",correo,rol_id,estado}=req.body||{};
  const existing=db.prepare("SELECT * FROM usuarios WHERE id=?").get(id);
  if(!existing || (!isAdmin(req.user) && existing.empresa_id!==req.user.empresa_id)) return res.status(404).json({error:"Usuario no encontrado"});
  const empresa_id = isAdmin(req.user) && req.body?.empresa_id ? Number(req.body.empresa_id) : existing.empresa_id;
  if(!db.prepare("SELECT id FROM empresas WHERE id=? AND estado=1").get(empresa_id)) return res.status(400).json({error:"Empresa no válida"});
  db.prepare("UPDATE usuarios SET empresa_id=?,nombre=?,apellido=?,correo=?,rol_id=?,estado=? WHERE id=?").run(empresa_id,nombre.trim(),apellido.trim(),correo.trim(),Number(rol_id),estado?1:0,id);
  audit(req,"EDITAR",`Editó usuario ${id}`);
  res.json({ok:true});
});

r.patch("/:id/estado", requireAuth, requirePermission("usuarios.editar"), (req,res)=>{
  const id=Number(req.params.id); if(id===req.user.id)return res.status(400).json({error:"No puede desactivarse a sí mismo"});
  const u=db.prepare("SELECT estado,empresa_id FROM usuarios WHERE id=?").get(id);
  if(!u || (!isAdmin(req.user)&&u.empresa_id!==req.user.empresa_id))return res.status(404).json({error:"Usuario no encontrado"});
  const estado=u.estado?0:1; db.prepare("UPDATE usuarios SET estado=? WHERE id=?").run(estado,id); audit(req,"ESTADO",`Cambió estado de usuario ${id} a ${estado?"Activo":"Inactivo"}`); res.json({ok:true,estado});
});

r.post("/:id/password", requireAuth, requirePermission("usuarios.editar"), (req,res)=>{
  const id=Number(req.params.id),{password}=req.body||{}; if(!password)return res.status(400).json({error:"Contraseña obligatoria"});
  const u=db.prepare("SELECT empresa_id FROM usuarios WHERE id=?").get(id); if(!u||(!isAdmin(req.user)&&u.empresa_id!==req.user.empresa_id))return res.status(404).json({error:"Usuario no encontrado"}); const policyError=passwordPolicyError(password,securityConfig(u.empresa_id)); if(policyError)return res.status(400).json({error:policyError});
  db.prepare("UPDATE usuarios SET password_hash=? WHERE id=?").run(bcrypt.hashSync(password,12),id); audit(req,"PASSWORD",`Cambió contraseña del usuario ${id}`); const target=db.prepare("SELECT nombre,correo,empresa_id FROM usuarios WHERE id=?").get(id); if(target?.correo) sendNotification({empresaId:target.empresa_id,event:"CAMBIO_CLAVE",to:target.correo,vars:{nombre:target.nombre,empresa:db.prepare("SELECT nombre FROM empresas WHERE id=?").get(target.empresa_id)?.nombre||""}}).catch(e=>console.warn("[NOTIFICACIONES] Cambio clave:",e.message)); res.json({ok:true});
});

r.post("/mi-password", requireAuth, (req,res)=>{const {actual,nueva}=req.body||{},u=db.prepare("SELECT password_hash FROM usuarios WHERE id=?").get(req.user.id);if(!bcrypt.compareSync(actual||"",u.password_hash))return res.status(401).json({error:"Contraseña actual incorrecta"});if(!nueva||nueva.length<8)return res.status(400).json({error:"Mínimo 8 caracteres"});db.prepare("UPDATE usuarios SET password_hash=? WHERE id=?").run(bcrypt.hashSync(nueva,12),req.user.id);audit(req,"PASSWORD","Cambió su propia contraseña"); const target=db.prepare("SELECT nombre,correo,empresa_id FROM usuarios WHERE id=?").get(req.user.id); if(target?.correo) sendNotification({empresaId:target.empresa_id,event:"CAMBIO_CLAVE",to:target.correo,vars:{nombre:target.nombre,empresa:db.prepare("SELECT nombre FROM empresas WHERE id=?").get(target.empresa_id)?.nombre||""}}).catch(e=>console.warn("[NOTIFICACIONES] Cambio clave:",e.message)); res.json({ok:true})});

export default r;
