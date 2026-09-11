# FASE 18.6 V1 — Exportación PDF / Excel / CSV

Implementa exportaciones desde reportes estándar y personalizados.

- PDF corporativo con marca blanca, empresa legal, NIT, colores, título, tabla y pie.
- XLSX compatible con Excel con encabezado corporativo y hoja de reporte.
- CSV UTF-8 con encabezados y datos.
- Aislamiento multiempresa por empresa_id.
- Rutas: `/api/exportaciones/estandar/:tipo` y `/api/exportaciones/personalizado/:id`.
- Parámetro `formato`: `pdf`, `xlsx` o `csv`.
- No recrea la base de datos.
