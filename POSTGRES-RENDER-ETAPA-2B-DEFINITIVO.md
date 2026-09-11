# IT GPS APP — PostgreSQL / Render — Etapa 2B definitiva

Esta versión usa PostgreSQL directamente en el backend cuando `DATABASE_URL` está definida. Las rutas existentes conservan su API síncrona mediante una capa de compatibilidad que ejecuta las consultas PostgreSQL en un worker dedicado.

## Publicación

1. No ejecutar `npm run db:init` en Render.
2. En Render configurar `DATABASE_URL` con la **Internal Database URL** de `it-gps-app-db`.
3. Mantener `JWT_SECRET` generado por Render y `FRONTEND_ORIGIN` apuntando a `RENDER_EXTERNAL_URL`.
4. Para migrar los datos del SQLite original, usar el script `server/scripts/migrate-sqlite-to-postgres.cjs` desde una máquina que tenga el `itgps.db` original y la **External Database URL** de Render.
5. Después de la migración, desplegar el servicio.

## Seguridad

Los archivos `server/data/*.db`, `.env` y credenciales no deben entrar al repositorio.
