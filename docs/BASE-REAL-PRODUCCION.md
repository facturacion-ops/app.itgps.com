# Base real de producción

La base utilizada durante desarrollo contiene información de prueba. Para producción se debe trabajar con una base nueva y limpia, aplicando el esquema y las migraciones incrementales de esta versión.

## Regla
- No copiar registros de prueba a producción.
- No ejecutar `npm run db:init` sobre una base operacional que ya contenga datos reales.
- La base de producción se debe inicializar una sola vez y luego conservar mediante migraciones.
- Los catálogos, empresas, usuarios, clientes, prospectos, servicios, planes y demás datos se cargarán con información real.

## Cotizaciones
Las cotizaciones pueden pertenecer a un cliente o a un prospecto. Cuando un prospecto se convierte en cliente, sus cotizaciones se vinculan automáticamente al nuevo cliente.
