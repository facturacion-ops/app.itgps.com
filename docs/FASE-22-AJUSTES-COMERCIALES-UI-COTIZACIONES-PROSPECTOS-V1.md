# FASE 22 — Ajustes Comerciales, UI y Cotizaciones V1

## Incluido
- Menú con mayor contraste y colores vivos uniformes.
- Formularios de alta/edición con ancho uniforme y mayor aprovechamiento horizontal.
- Cotizaciones asociables a Prospectos sin convertirlos previamente en Clientes.
- Código de Prospecto automático y consecutivo por empresa.
- Código de Cotización automático y consecutivo por empresa; no editable manualmente.
- Descarga de cotizaciones en PDF.
- Al convertir un prospecto en cliente, las cotizaciones previas del prospecto quedan vinculadas al nuevo cliente.

## Base de datos
La migración es incremental y conserva los registros existentes. No ejecutar `npm run db:init`.

## Base real
La base actual contiene datos de prueba. Para pasar a producción se debe crear una base limpia a partir del esquema y migraciones, y cargar únicamente información real mediante los módulos de la aplicación. No se borra la base actual automáticamente en esta fase.

## V2 — Corrección de arranque

Se corrigió la migración de `cotizaciones` para no modificar `sqlite_master`. SQLite puede bloquear esa operación; ahora la tabla se reconstruye de forma controlada, conservando los datos existentes y permitiendo `cliente_id` nulo para cotizaciones dirigidas a prospectos. Las claves foráneas se desactivan temporalmente durante el reemplazo y se restauran al finalizar.
