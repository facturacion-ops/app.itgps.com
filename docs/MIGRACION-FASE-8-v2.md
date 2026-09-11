# Fase 8 — Corrección de migración Equipos GPS

Esta versión corrige el error `no such column: activo_id` cuando la BD ya tenía
una tabla `equipos` creada por una versión anterior.

`npm run db:init` ahora:
1. Detecta las columnas existentes de `equipos`.
2. Agrega solamente las columnas que falten.
3. Crea los índices después de la migración.

No borrar `server/data/itgps.db`.
