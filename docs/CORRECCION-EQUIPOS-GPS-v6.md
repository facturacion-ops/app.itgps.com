# Corrección Fase 8 — Equipos GPS v6

Se corrigieron las consultas del backend de Equipos GPS que todavía utilizaban
`a.tipo`, columna inexistente en `activos`.

La estructura real utiliza:
`activos.tipo_activo`

Se mantuvo el alias `activo_tipo` para no cambiar el frontend.

Consultas corregidas:
- GET /api/equipos/:id
- GET /api/equipos

No se modifica ni se elimina la base de datos existente.
