import { Router } from "express";
import { db } from "../db/database.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { buildDocumentModel, renderDocumentHtml } from "../services_documentRenderer.js";

const r = Router();
const isAdmin = u => u.rol === "Administrador";
function companyId(req) {
  const requested = Number(req.query.empresa_id || 0);
  return isAdmin(req.user) && requested ? requested : req.user.empresa_id;
}
function audit(req, empresaId, detalle) {
  try { db.prepare("INSERT INTO auditoria(empresa_id,usuario_id,accion,modulo,detalle,ip,resultado,metodo,ruta,user_agent) VALUES(?,?,?,?,?,?,?,?,?,?)").run(empresaId, req.user.id, "VISTA_PREVIA", "DOCUMENTOS", detalle, req.ip, "OK", req.method, req.originalUrl, req.get("user-agent") || ""); } catch {}
}

r.get("/preview", requireAuth, requirePermission("reportes.ver"), (req,res) => {
  const empresaId = companyId(req);
  const model = buildDocumentModel({
    empresaId,
    tipo: String(req.query.tipo || "DOCUMENTO").slice(0,40),
    titulo: String(req.query.titulo || "Documento de demostración").slice(0,160),
    numero: String(req.query.numero || "DEMO-0001").slice(0,80),
    rows: [{ concepto:"Motor documental", estado:"Activo", resultado:"Marca blanca aplicada" }]
  });
  if (!model) return res.status(404).send("Empresa no encontrada o inactiva");
  audit(req, empresaId, `Generó vista previa documental para empresa ${empresaId}`);
  res.type("html").send(renderDocumentHtml(model));
});

export default r;
