import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { getBrand, buildDocumentModel } from '../services_documentRenderer.js';
import { buildPdf, buildXlsx, getStandard, getCustom } from '../services_export.js';
import { db } from '../db/database.js';
const r=Router();
const admin=u=>u.rol==='Administrador';
function company(req,requested){const id=Number(requested||0);return admin(req.user)&&id?id:req.user.empresa_id}
function send(req,res,data,format,name,brand){
 if(format==='csv'){
  const csv=[data.columns.map(x=>`"${String(x).replaceAll('"','""')}"`).join(','),...data.rows.map(row=>data.columns.map(c=>`"${String(row[c]??'').replaceAll('"','""')}"`).join(','))].join('\r\n');res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="${name}.csv"`);return res.send('\ufeff'+csv)
 }
 if(format==='xlsx'){const b=buildXlsx({...data,brand});res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition',`attachment; filename="${name}.xlsx"`);return res.end(b)}
 const b=buildPdf({...data,brand});res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="${name}.pdf"`);return res.end(b)
}
r.get('/estandar/:tipo',requireAuth,requirePermission('reportes.ver'),(req,res)=>{const empresa=company(req,req.query.empresa_id);const brand=getBrand(empresa);if(!brand)return res.status(404).json({error:'Empresa no encontrada'});const type=req.params.tipo;if(type==='resumen')return res.status(400).json({error:'El resumen no se exporta en V1'});const data=getStandard(type,empresa,String(req.query.q||''));data.title=data.title+' — '+brand.identidad_principal;send(req,res,data,String(req.query.formato||'pdf'),`ITGPS_${type}_${empresa}`,brand)})
r.get('/personalizado/:id',requireAuth,requirePermission('reportes_personalizados.ver'),(req,res)=>{const empresa=company(req,req.query.empresa_id);const brand=getBrand(empresa);const data=getCustom(Number(req.params.id),empresa);if(!brand||!data)return res.status(404).json({error:'Reporte personalizado no encontrado'});send(req,res,data,String(req.query.formato||'pdf'),`ITGPS_${String(data.title).replace(/[^a-z0-9]+/gi,'_').slice(0,50)}_${empresa}`,brand)})
export default r;
