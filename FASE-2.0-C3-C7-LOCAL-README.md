# FASE 2.0 C3-C7 — Preview local

Esta versión mantiene compatibilidad dual:
- Local, sin DATABASE_URL: SQLite en `server/data/itgps.db`.
- Render/producción, con DATABASE_URL: PostgreSQL.

No ejecutar `npm run db:init` para este preview. El servidor local aplica las migraciones existentes automáticamente al iniciar.
