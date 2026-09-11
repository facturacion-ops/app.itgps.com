# IT GPS APP — ETAPA 2B DEFINITIVA — PostgreSQL / Render

Esta versión incorpora el puente de compatibilidad PostgreSQL para el backend existente.

## Antes de publicar
1. Migrar los datos del SQLite original a PostgreSQL usando `server/scripts/migrate-sqlite-to-postgres.cjs` y la External Database URL de Render.
2. No subir archivos SQLite (`server/data/*.db`) a GitHub.
3. En Render usar la Internal Database URL como `DATABASE_URL`.
4. Mantener `JWT_SECRET` y `FRONTEND_ORIGIN` configurados.

## Instalación
```bash
npm install
npm run install:all
```

No ejecutar `npm run db:init` cuando `DATABASE_URL` esté configurada.

## Nota
El backend conserva temporalmente la API síncrona SQLite mediante un caché SQLite temporal respaldado por PostgreSQL. PostgreSQL es la persistencia. Esto permite llevar el proyecto actual a Render sin reescribir las cientos de llamadas síncronas de acceso a datos en esta etapa.
