import zlib from 'node:zlib';

function escPdfText(value) {
  const normalized = String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2026/g, '...');
  return normalized
    .replace(/á/g, '\xE1').replace(/é/g, '\xE9').replace(/í/g, '\xED').replace(/ó/g, '\xF3').replace(/ú/g, '\xFA')
    .replace(/Á/g, '\xC1').replace(/É/g, '\xC9').replace(/Í/g, '\xCD').replace(/Ó/g, '\xD3').replace(/Ú/g, '\xDA')
    .replace(/ü/g, '\xFC').replace(/Ü/g, '\xDC').replace(/ñ/g, '\xF1').replace(/Ñ/g, '\xD1')
    .replace(/¿/g, '\xBF').replace(/¡/g, '\xA1').replace(/°/g, '\xB0');
}

function parseDataUrl(value) {
  const m = String(value || '').match(/^data:([^;,]+)(?:;charset=[^;,]+)?;base64,(.+)$/s);
  if (!m) return null;
  try { return { mime: m[1].toLowerCase(), data: Buffer.from(m[2], 'base64') }; }
  catch { return null; }
}

function readUInt32(buf, o) { return buf.readUInt32BE(o); }

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decodePng(buffer) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  if (!buffer.subarray(0, 8).equals(signature)) return null;
  let pos = 8, width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idats = [];
  while (pos + 8 <= buffer.length) {
    const len = readUInt32(buffer, pos); pos += 4;
    const type = buffer.toString('ascii', pos, pos + 4); pos += 4;
    const data = buffer.subarray(pos, pos + len); pos += len;
    pos += 4; // CRC
    if (type === 'IHDR') {
      width = readUInt32(data, 0); height = readUInt32(data, 4); bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idats.push(data);
    else if (type === 'IEND') break;
  }
  if (!width || !height || bitDepth !== 8 || interlace !== 0 || ![2, 6].includes(colorType)) return null;
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  let raw;
  try { raw = zlib.inflateSync(Buffer.concat(idats)); } catch { return null; }
  const rows = Buffer.alloc(height * stride);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = rows.subarray(y * stride, (y + 1) * stride);
    const prev = y ? rows.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const left = x >= bpp ? row[x - bpp] : 0;
      const up = prev ? prev[x] : 0;
      const upLeft = prev && x >= bpp ? prev[x - bpp] : 0;
      const value = raw[src++];
      if (filter === 0) row[x] = value;
      else if (filter === 1) row[x] = (value + left) & 255;
      else if (filter === 2) row[x] = (value + up) & 255;
      else if (filter === 3) row[x] = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) row[x] = (value + paeth(left, up, upLeft)) & 255;
      else return null;
    }
  }
  // PDF image is RGB. Composite transparent PNG pixels onto white so no
  // separate soft-mask object is required.
  const rgb = Buffer.alloc(width * height * 3);
  let di = 0;
  for (let i = 0; i < rows.length; i += bpp) {
    const a = bpp === 4 ? rows[i + 3] / 255 : 1;
    rgb[di++] = Math.round(rows[i] * a + 255 * (1 - a));
    rgb[di++] = Math.round(rows[i + 1] * a + 255 * (1 - a));
    rgb[di++] = Math.round(rows[i + 2] * a + 255 * (1 - a));
  }
  return { width, height, rgb, filter: 'flate' };
}

function jpegSize(buffer) {
  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) return null;
  let p = 2;
  while (p + 9 < buffer.length) {
    if (buffer[p] !== 0xFF) { p++; continue; }
    const marker = buffer[p + 1]; p += 2;
    if ([0xD8,0xD9].includes(marker)) continue;
    if (p + 2 > buffer.length) return null;
    const len = buffer.readUInt16BE(p);
    if ([0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB,0xCD,0xCE,0xCF].includes(marker)) {
      if (p + 7 > buffer.length) return null;
      return { width: buffer.readUInt16BE(p + 5), height: buffer.readUInt16BE(p + 3) };
    }
    p += len;
  }
  return null;
}

function prepareLogo(dataUrl) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  if (parsed.mime === 'image/png') {
    const png = decodePng(parsed.data);
    if (png) return png;
  }
  if (parsed.mime === 'image/jpeg' || parsed.mime === 'image/jpg') {
    const size = jpegSize(parsed.data);
    if (size) return { ...size, jpeg: parsed.data };
  }
  return null;
}

function pdfImageObjects(logo, addObject) {
  if (!logo) return null;
  if (logo.jpeg) {
    const obj = addObject(Buffer.concat([
      Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.jpeg.length} >>\nstream\n`),
      logo.jpeg,
      Buffer.from('\nendstream')
    ]));
    return { ref: obj, width: logo.width, height: logo.height };
  }
  const compressed = zlib.deflateSync(logo.rgb, { level: 6 });
  const obj = addObject(Buffer.concat([
    Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`),
    compressed,
    Buffer.from('\nendstream')
  ]));
  return { ref: obj, width: logo.width, height: logo.height };
}

function fitLogo(logo, maxW, maxH) {
  const scale = Math.min(maxW / logo.width, maxH / logo.height, 1);
  return { w: logo.width * scale, h: logo.height * scale };
}

export function buildPdf({ title = 'Reporte', columns = [], rows = [], brand = {} }) {
  const W = 595, H = 842, margin = 42, usableW = W - margin * 2;
  const main = brand.color_principal || '#1577C6';
  const accent = brand.color_acento || '#8CF63C';
  const hex = (h) => {
    const clean = String(h).replace('#', '');
    return [parseInt(clean.slice(0, 2), 16) / 255, parseInt(clean.slice(2, 4), 16) / 255, parseInt(clean.slice(4, 6), 16) / 255];
  };
  const [r,g,b] = hex(main), [ar,ag,ab] = hex(accent);
  const safeColumns = columns.length ? columns : ['Información'];
  const safeRows = rows.length ? rows : [{}];
  const colCount = safeColumns.length;
  const colW = usableW / colCount;
  const headerH = 20;
  const rowsPerPage = 36;
  const pageCount = Math.max(1, Math.ceil(safeRows.length / rowsPerPage));
  const logo = prepareLogo(brand.logo_principal);
  const logoBox = logo ? fitLogo(logo, 135, 52) : { w: 0, h: 0 };

  const objects = [];
  const addObject = (value) => { objects.push(Buffer.isBuffer(value) ? value : Buffer.from(String(value))); return objects.length; };
  const f1 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const img = logo ? pdfImageObjects(logo, addObject) : null;

  const makeText = (ops, x, y, size, value, bold = false, maxChars = 100) => {
    const s = escPdfText(String(value ?? '').slice(0, maxChars));
    if (!s) return;
    ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${s}) Tj ET`);
  };
  const rect = (ops, rr,gg,bb,x,y,w,h) => ops.push(`${rr} ${gg} ${bb} rg ${x} ${y} ${w} ${h} re f`);
  const line = (ops, rr,gg,bb,x1,y1,x2,y2) => ops.push(`${rr} ${gg} ${bb} RG ${x1} ${y1} m ${x2} ${y2} l S`);

  const makePage = (pageRows, pageNo) => {
    const ops = [];
    rect(ops,r,g,b,margin,H-65,usableW,4);
    const textX = logoBox.w ? margin + logoBox.w + 14 : margin;
    if (img) ops.push(`q ${logoBox.w.toFixed(2)} 0 0 ${logoBox.h.toFixed(2)} ${margin.toFixed(2)} ${(H-121-logoBox.h/2).toFixed(2)} cm /Im1 Do Q`);
    makeText(ops,textX,H-94,19,brand.identidad_principal || brand.nombre_comercial || 'Empresa',true,55);
    makeText(ops,textX,H-112,9,brand.razon_social || '',false,75);
    if (brand.empresa?.nit) makeText(ops,textX,H-126,9,`NIT ${brand.empresa.nit}`,false,40);
    makeText(ops,392,H-94,11,title,true,28);
    makeText(ops,392,H-110,9,new Date().toLocaleDateString('es-CO',{timeZone:brand.zona_horaria||'America/Bogota'}),false,20);
    rect(ops,ar,ag,ab,margin,H-145,usableW,1.5);

    const top = H - 168;
    rect(ops,r,g,b,margin,top-headerH+3,usableW,headerH);
    ops.push('1 1 1 rg');
    safeColumns.forEach((c,i)=>makeText(ops,margin+i*colW+5,top-10,7,String(c).replaceAll('_',' '),true,24));
    ops.push('0.15 0.18 0.22 rg');
    let y = top - 29;
    for (const row of pageRows) {
      safeColumns.forEach((c,i)=>makeText(ops,margin+i*colW+5,y,7,String(row[c] ?? '—'),false,Math.max(8,Math.floor(colW/4.2))));
      line(ops,0.88,0.9,0.92,margin,y-5,margin+usableW,y-5);
      y -= 16;
    }
    makeText(ops,margin,35,7,`${brand.pie_pagina||brand.texto_legal||''}  ·  Página ${pageNo} de ${pageCount}`,false,180);
    return Buffer.from(ops.join('\n'),'latin1');
  };

  const contentRefs = [];
  const pageRefs = [];
  for (let pageNo=1; pageNo<=pageCount; pageNo++) {
    const start=(pageNo-1)*rowsPerPage;
    const pageRows=safeRows.slice(start,start+rowsPerPage);
    const content=makePage(pageRows,pageNo);
    contentRefs.push(addObject(Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`),content,Buffer.from('\nendstream')])));
  }
  const pagesObj = addObject('PAGES_PLACEHOLDER');
  for (let i=0;i<pageCount;i++) {
    const resourcesImages = img ? `/XObject << /Im1 ${img.ref} 0 R >>` : '';
    pageRefs.push(addObject(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> ${resourcesImages} >> /Contents ${contentRefs[i]} 0 R >>`));
  }
  objects[pagesObj-1] = Buffer.from(`<< /Type /Pages /Kids [${pageRefs.map(x=>`${x} 0 R`).join(' ')}] /Count ${pageCount} >>`);
  const catalogObj = addObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  let out = Buffer.from('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n','latin1');
  const offsets = [0];
  for (let i=0;i<objects.length;i++) {
    offsets[i+1] = out.length;
    out = Buffer.concat([out,Buffer.from(`${i+1} 0 obj\n`),objects[i],Buffer.from('\nendobj\n')]);
  }
  const xref = out.length;
  let tail = `xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for (let i=1;i<=objects.length;i++) tail += `${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
  tail += `trailer\n<< /Size ${objects.length+1} /Root ${catalogObj} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.concat([out,Buffer.from(tail,'latin1')]);
}
