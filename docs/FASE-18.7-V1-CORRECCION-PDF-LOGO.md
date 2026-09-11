# FASE 18.7 V1 — Corrección de exportación PDF y logo corporativo

## Base
Parte directamente de FASE 18.6 V3 — Corrección Payload.

## Problemas corregidos
1. El PDF mostraba el encabezado, pero los textos de las filas podían quedar fuera de posición porque el motor utilizaba desplazamientos de texto acumulativos (`Td`).
2. El PDF no incorporaba el `logo_principal` de la marca blanca.
3. La salida PDF quedaba visualmente incompleta aunque la consulta SQL sí devolviera los registros.

## Solución
- Nuevo servicio `server/src/services_pdf.js`.
- Posicionamiento absoluto de cada texto mediante `Tm`, evitando acumulación de coordenadas.
- Inclusión del logo principal almacenado como Data URL.
- Soporte para PNG de 8 bits RGB/RGBA y JPEG.
- PNG transparente compuesto sobre fondo blanco para impresión estable.
- Encabezado corporativo con identidad principal, razón social, NIT, título y fecha.
- Tabla de resultados conservando las columnas y registros obtenidos por el reporte.
- Compatibilidad con la marca blanca existente por `empresa_id`.
- No se modifica ni recrea la base de datos.

## Resultado esperado para Clientes
El PDF debe mostrar los registros que ya aparecen en la vista previa:
- OMAR SALAS — 79529218 — BOGOTA — estado 1 — 2026-08-18 00:16:36
- PEDRO ALVARADO — 19179263 — BOGOTA — estado 1 — 2026-08-18 00:00:44
- SISTEMAS DE MONITOREO — 9 — BOGOTA — estado 1 — 2026-08-18 01:58:19

## Validación
1. Abrir Reportes → Clientes.
2. Verificar que la vista previa conserva los registros.
3. Exportar PDF.
4. Confirmar logo principal visible en el encabezado.
5. Confirmar que las 5 columnas y los 3 registros aparecen dentro de la página.
6. Confirmar que Excel y CSV continúan funcionando.
7. Repetir con otra empresa para verificar aislamiento por `empresa_id`.

## Base de datos
No ejecutar `npm run db:init` para esta fase.
