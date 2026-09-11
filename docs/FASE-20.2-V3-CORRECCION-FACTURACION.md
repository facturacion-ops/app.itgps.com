# FASE 20.2 V3 — Corrección de consulta de Facturación

## Corrección
Se corrigió la consulta GET `/api/invoices` en `server/src/routes/invoices.js`.

La consulta utilizaba `su.codigo` (código de suscripción) pero no incluía el `LEFT JOIN suscripciones su`. Esto provocaba el error de SQLite:

`SqliteError: no such column: su.codigo`

Se agregó únicamente el JOIN faltante:

`LEFT JOIN suscripciones su ON su.id=f.suscripcion_id`

## Alcance
- No se modifica la estructura de la base de datos.
- No se elimina ni recrea la base de datos.
- No se cambia la lógica de facturación.
- Se conserva la consulta de detalle de factura.

## Validación
El archivo `server/src/routes/invoices.js` pasó `node --check` correctamente.
