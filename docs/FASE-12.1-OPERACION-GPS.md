# FASE 12.1 — Operación GPS

Integración sobre la Fase 11 V2.2 y BD existente.

Incluye:
- Menú Operación GPS.
- Permiso `operacion_gps.ver` y `operacion_gps.editar`.
- Indicadores de equipos: total, online, offline, sin comunicación, con activo, con SIM, mantenimiento y fuera de servicio.
- Filtros por empresa, conectividad y estado operacional.
- Ficha con barra lateral mediante la UI transversal.
- Actualización de estado, última comunicación, última posición y observaciones.
- Registro en auditoría.

La migración es aditiva e idempotente. NO usar `npm run db:init` sobre la BD existente.
