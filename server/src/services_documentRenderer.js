import { db } from "./db/database.js";

const esc = (v) => String(v ?? "").replace(/[&<>\"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

export function getBrand(empresaId) {
  const empresa = db.prepare("SELECT id,nombre,nit FROM empresas WHERE id=? AND estado=1").get(empresaId);
  if (!empresa) return null;
  const marca = db.prepare("SELECT * FROM empresa_marca WHERE empresa_id=?").get(empresaId) || {};
  // Regla documental transversal:
  // - La empresa legal siempre proviene de empresas.
  // - La marca blanca proviene exclusivamente de empresa_marca.
  // Nunca mezclamos nombre legal con nombre de marca.
  const nombreAplicacion = String(marca.nombre_aplicacion || '').trim();
  const nombreComercial = String(marca.nombre_comercial || '').trim();
  const identidadPrincipal = nombreComercial || nombreAplicacion || empresa.nombre;
  return {
    empresa,
    identidad_principal: identidadPrincipal,
    razon_social: empresa.nombre,
    nombre_aplicacion: nombreAplicacion || identidadPrincipal,
    nombre_comercial: nombreComercial || identidadPrincipal,
    logo_principal: marca.logo_principal || "",
    logo_secundario: marca.logo_secundario || "",
    favicon: marca.favicon || "",
    color_principal: /^#[0-9A-Fa-f]{6}$/.test(marca.color_principal || "") ? marca.color_principal : "#0A1E2E",
    color_secundario: /^#[0-9A-Fa-f]{6}$/.test(marca.color_secundario || "") ? marca.color_secundario : "#F5F8FA",
    color_acento: /^#[0-9A-Fa-f]{6}$/.test(marca.color_acento || "") ? marca.color_acento : "#8CF63C",
    encabezado: marca.encabezado || "",
    pie_pagina: marca.pie_pagina || "",
    texto_legal: marca.texto_legal || "",
    terminos_condiciones: marca.terminos_condiciones || "",
    firma_nombre: marca.firma_nombre || "",
    firma_cargo: marca.firma_cargo || "",
    datos_bancarios: marca.datos_bancarios || "",
    moneda: marca.moneda || "COP",
    formato_fecha: marca.formato_fecha || "DD/MM/YYYY",
    formato_numerico: marca.formato_numerico || "es-CO",
    zona_horaria: marca.zona_horaria || "America/Bogota"
  };
}

export function buildDocumentModel({ empresaId, tipo="DOCUMENTO", titulo="Documento de demostración", numero="DEMO-0001", rows=[] }={}) {
  const brand = getBrand(empresaId);
  if (!brand) return null;
  return {
    tipo, titulo, numero, emitido_en: new Date().toISOString(),
    empresa: brand.empresa,
    marca: brand,
    rows
  };
}

export function renderDocumentHtml(doc) {
  const b = doc.marca;
  const logo = b.logo_principal ? `<img class="logo" src="${esc(b.logo_principal)}" alt="Logo">` : `<div class="logo-fallback">IT</div>`;
  const rows = (doc.rows || []).map(r => `<tr>${Object.values(r).map(v => `<td>${esc(v) || "—"}</td>`).join("")}</tr>`).join("");
  const heads = doc.rows?.length ? Object.keys(doc.rows[0]).map(k => `<th>${esc(k.replaceAll("_"," "))}</th>`).join("") : "<th>Información</th>";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(doc.titulo)} - ${esc(b.nombre_comercial)}</title>${b.favicon ? `<link rel="icon" href="${esc(b.favicon)}">` : ""}<style>
  :root{--main:${b.color_principal};--secondary:${b.color_secundario};--accent:${b.color_acento};}*{box-sizing:border-box}body{margin:0;background:#eef2f5;font-family:Arial,Helvetica,sans-serif;color:#18212b}.sheet{width:210mm;min-height:297mm;margin:24px auto;background:#fff;padding:18mm;box-shadow:0 4px 20px #0001}.head{display:flex;align-items:center;gap:14px;border-bottom:4px solid var(--accent);padding-bottom:14px}.logo{max-height:58px;max-width:180px;object-fit:contain}.logo-fallback{width:58px;height:58px;border-radius:12px;background:var(--main);color:#fff;display:grid;place-items:center;font-weight:800;font-size:24px}.brand{flex:1}.brand b{display:block;font-size:20px;color:var(--main)}.brand small{color:#66727d}.doc{text-align:right}.doc small{display:block;color:#66727d}.doc strong{font-size:18px}.intro{margin:18px 0;padding:12px 14px;background:var(--secondary);border-left:4px solid var(--accent);white-space:pre-wrap}.section{margin-top:22px}.section h2{font-size:15px;color:var(--main);border-bottom:1px solid #dce2e7;padding-bottom:8px}.table{width:100%;border-collapse:collapse;margin-top:10px}.table th{background:var(--main);color:#fff;text-align:left}.table th,.table td{padding:8px;border:1px solid #dce2e7;font-size:12px}.legal{margin-top:24px;font-size:11px;color:#596570;white-space:pre-wrap}.signature{margin-top:38px;width:280px;border-top:1px solid #7a8791;padding-top:8px;font-size:12px}.footer{margin-top:30px;padding-top:12px;border-top:1px solid #dce2e7;font-size:10px;color:#66727d;white-space:pre-wrap}.actions{position:fixed;right:18px;top:18px}.actions button{background:var(--main);color:#fff;border:0;border-radius:7px;padding:9px 14px;cursor:pointer}@media print{body{background:#fff}.sheet{margin:0;box-shadow:none;width:auto;min-height:auto}.actions{display:none}}
  </style></head><body><div class="actions"><button onclick="window.print()">Imprimir / Guardar PDF</button></div><main class="sheet">
  <header class="head">${logo}<div class="brand"><b>${esc(b.identidad_principal)}</b><small>Marca blanca${b.empresa.nit ? ` · NIT ${esc(b.empresa.nit)}` : ""}</small></div><div class="doc"><small>${esc(doc.tipo)}</small><strong>${esc(doc.numero)}</strong></div></header>
  ${b.encabezado ? `<div class="intro">${esc(b.encabezado)}</div>` : ""}
  <section class="section"><h2>${esc(doc.titulo)}</h2><p><b>Marca blanca:</b> ${esc(b.identidad_principal)}<br><b>Empresa / razón social legal:</b> ${esc(b.razon_social)}${b.empresa.nit ? ` · NIT ${esc(b.empresa.nit)}` : ""}<br><b>Fecha:</b> ${new Intl.DateTimeFormat(b.formato_numerico || "es-CO", {timeZone:b.zona_horaria || "America/Bogota", dateStyle:"long"}).format(new Date(doc.emitido_en))}</p></section>
  <section class="section"><h2>Datos del documento</h2><table class="table"><thead><tr>${heads}</tr></thead><tbody>${rows || `<tr><td>Motor documental transversal funcionando correctamente.</td></tr>`}</tbody></table></section>
  ${b.terminos_condiciones ? `<section class="section"><h2>Términos y condiciones</h2><div class="legal">${esc(b.terminos_condiciones)}</div></section>` : ""}
  ${b.firma_nombre || b.firma_cargo ? `<div class="signature"><b>${esc(b.firma_nombre)}</b><br>${esc(b.firma_cargo)}</div>` : ""}
  ${b.datos_bancarios ? `<section class="section"><h2>Información de pago</h2><div class="legal">${esc(b.datos_bancarios)}</div></section>` : ""}
  ${b.texto_legal ? `<div class="legal">${esc(b.texto_legal)}</div>` : ""}
  ${b.pie_pagina ? `<footer class="footer">${esc(b.pie_pagina)}</footer>` : ""}
  </main></body></html>`;
}
