# IT GPS APP — Etapa 2: resultado de análisis y herramienta de migración

Fecha: 2026-09-06

## Fuente verificada
`server/data/itgps.db` del ZIP `IT-GPS-APP-Nube-Piloto-Render-V1`.

## Resultado
- 50 tablas
- Foreign keys: 0 violaciones
- 2 empresas
- 2 usuarios activos
- 5 roles
- 145 permisos
- 155 relaciones rol/permisos
- 188 auditorías
- 3 clientes
- 1 prospecto
- 1 activo
- 2 equipos GPS
- 2 SIM
- 3 servicios
- 2 planes comerciales
- 3 suscripciones
- 4 cotizaciones
- 3 facturas
- 7 pagos de cartera

## Archivos agregados
- `server/src/db/schema.postgres.sql`: esquema PostgreSQL generado desde la estructura final de la BD SQLite verificada.
- `server/scripts/migrate-sqlite-to-postgres.cjs`: migrador de datos SQLite → PostgreSQL que conserva IDs y reajusta secuencias.
- `server/package.json`: agrega dependencia `pg`.

## Importante
Esta etapa prepara y ejecuta la **migración de datos**. El backend todavía debe pasar por la etapa de adaptación de acceso SQLite → PostgreSQL antes de hacer el deploy final. No ejecutar un deploy de producción usando este ZIP como si ya fuera PostgreSQL.
