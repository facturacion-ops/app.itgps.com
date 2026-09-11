import { db } from './db/database.js';
import { getBrand } from './services_documentRenderer.js';

const escXml=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const escPdf=v=>String(v??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ');

function getStandard(type, empresaId, q=''){
 const map={
 clientes:['clientes',['codigo','nombre','nit','tipo_cliente','contacto','telefono','correo','ciudad','estado','fecha_creacion'],'nombre'],
 activos:['activos',['codigo','placa','tipo_activo','marca','linea','modelo','estado','fecha_alta'],'codigo'],
 equipos:['equipos',['imei','codigo','numero_serie','fabricante','marca','modelo','tipo_dispositivo','estado','firmware'],'imei'],
 sim:['sim_cards',['iccid','imsi','numero','operador','estado','fecha_activacion'],'iccid'],
 m2m:['m2m_planes',['nombre','operador','mb_incluidos','costo_mensual','dia_corte','estado'],'nombre']};
 const cfg=map[type]; if(!cfg)return {columns:[],rows:[],title:'Reporte'};
 const [table,cols,order]=cfg; let sql=`SELECT ${cols.join(',')} FROM ${table} WHERE empresa_id=?`; const params=[empresaId];
 if(q){const searchable=cols.filter(c=>['codigo','nombre','placa','imei','iccid','numero','operador','marca','modelo'].includes(c)); if(searchable.length){sql+=` AND (${searchable.map(c=>`CAST(${c} AS TEXT) LIKE ?`).join(' OR ')})`;params.push(...searchable.map(()=>`%${q}%`));}}
 sql+=` ORDER BY ${order} LIMIT 5000`; return {columns:cols,rows:db.prepare(sql).all(...params),title:({clientes:'Clientes',activos:'Activos',equipos:'Equipos GPS',sim:'Tarjetas SIM',m2m:'Planes M2M'})[type]||'Reporte'};
}
function getCustom(id, empresaId){
 const r=db.prepare('SELECT * FROM reportes_personalizados WHERE id=? AND empresa_id=?').get(id,empresaId); if(!r)return null;
 let cfg={};try{cfg=JSON.parse(r.configuracion||'{}')}catch{}
 const standard=getStandard(r.fuente,empresaId,''); const cols=(cfg.campos||[]).filter(c=>standard.columns.includes(c));
 const rows=standard.rows.map(x=>Object.fromEntries(cols.map(c=>[c,x[c]])));
 return {columns:cols,rows,title:r.nombre,fuente:r.fuente};
}
function xmlSheet(name, columns, rows, brand, title){
 const all=[[brand.identidad_principal||brand.nombre_comercial||'Empresa'],[title],[brand.empresa?.nit?`NIT ${brand.empresa.nit}`:''],columns,...rows.map(r=>columns.map(c=>r[c]))];
 const cells=all.map((row,ri)=>`<row r="${ri+1}">${row.map((v,ci)=>{const ref=String.fromCharCode(65+(ci%26))+(ri+1);return `<c r="${ref}" t="inlineStr"${ri===3?' s=\"1\"':''}><is><t>${escXml(v??'')}</t></is></c>`}).join('')}</row>`).join('');
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><cols><col min="1" max="${Math.max(columns.length,1)}" width="20" customWidth="1"/></cols><sheetData>${cells}</sheetData></worksheet>`;
}
function crc32(buf){let c=~0;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xEDB88320:0)}return (~c)>>>0}
function zipStore(files){const chunks=[],central=[];let offset=0;for(const [name,data] of Object.entries(files)){const nb=Buffer.from(name),d=Buffer.from(data),crc=crc32(d);const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt16LE(0,6);h.writeUInt16LE(0,8);h.writeUInt16LE(0,10);h.writeUInt16LE(0,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(d.length,18);h.writeUInt32LE(d.length,22);h.writeUInt16LE(nb.length,26);h.writeUInt16LE(0,28);chunks.push(h,nb,d);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0,8);c.writeUInt16LE(0,10);c.writeUInt16LE(0,12);c.writeUInt16LE(0,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(d.length,20);c.writeUInt32LE(d.length,24);c.writeUInt16LE(nb.length,28);c.writeUInt16LE(0,30);c.writeUInt16LE(0,32);c.writeUInt16LE(0,34);c.writeUInt16LE(0,36);c.writeUInt32LE(0,38);c.writeUInt32LE(offset,42);central.push(c,nb);offset+=h.length+nb.length+d.length}const cd=Buffer.concat(central),e=Buffer.alloc(22);e.writeUInt32LE(0x06054b50,0);e.writeUInt16LE(Object.keys(files).length,8);e.writeUInt16LE(Object.keys(files).length,10);e.writeUInt32LE(cd.length,12);e.writeUInt32LE(offset,16);return Buffer.concat([...chunks,cd,e])}
export function buildXlsx({title,columns,rows,brand}){
 const now=new Date().toISOString();const files={
 '[Content_Types].xml':`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
 '_rels/.rels':`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
 'xl/_rels/workbook.xml.rels':`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
 'xl/workbook.xml':`<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Reporte" sheetId="1" r:id="rId1"/></sheets></workbook>`,
 'xl/styles.xml':`<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="${(brand.color_principal||'#1577C6').slice(1).toUpperCase()}"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="1" borderId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`,
 'xl/worksheets/sheet1.xml':xmlSheet('Reporte',columns,rows,brand,title)
 }; return zipStore(files);
}
export { buildPdf } from './services_pdf.js';

export { getStandard, getCustom };
