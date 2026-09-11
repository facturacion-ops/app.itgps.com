# IT GPS APP — PostgreSQL / Render — Etapa 2B

Esta entrega deja el backend preparado para conservar la API síncrona existente de IT GPS APP mientras PostgreSQL pasa a ser la persistencia.

## Qué cambia
- `DATABASE_URL` activa el modo PostgreSQL.
- El backend carga PostgreSQL a un caché SQLite temporal para mantener compatibles las rutas existentes.
- Las escrituras se sincronizan de vuelta a PostgreSQL.
- Al reiniciar Render, el caché temporal se reconstruye desde PostgreSQL.
- El esquema PostgreSQL se aplica automáticamente al iniciar.
- `db:init` queda bloqueado cuando `DATABASE_URL` está configurado para evitar recrear datos de producción.

## Publicación
1. Ejecutar `npm install` y `npm run install:all`.
2. Migrar la base SQLite original al PostgreSQL de Render usando `server/scripts/migrate-sqlite-to-postgres.cjs` y la `DATABASE_URL` externa de Render.
3. No subir `server/data/*.db` a GitHub.
4. Subir el proyecto a GitHub.
5. En Render configurar `DATABASE_URL` con la **Internal Database URL** del PostgreSQL del mismo servicio/región.
6. Mantener `JWT_SECRET` y `FRONTEND_ORIGIN` configurados por Render.
7. Hacer Deploy y comprobar `/api/health` y login.

## Nota de arquitectura
La compatibilidad SQLite es un puente de transición para evitar reescribir las ~633 llamadas síncronas de acceso a datos en una sola etapa. Para cargas grandes/concurrencia alta, la siguiente evolución recomendada es una capa PostgreSQL nativa async/await.
