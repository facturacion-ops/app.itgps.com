# FASE 16.1 V2 — CLIENTES CORPORATIVOS

- Ficha corporativa consolidada.
- Contactos por función.
- Un contacto principal activo por función/tipo.
- Resumen real de activos, equipos GPS, SIM y contactos.
- Accesos contextuales a Activos, Equipos GPS y Tarjetas SIM.
- Servicios, contratos y suscripciones quedan preparados para fases comerciales posteriores.
- Auditoría conserva los cambios de clientes y contactos.

Migración incremental: `server/migrar-fase16-1-v2.cjs`.
No ejecutar `npm run db:init` sobre la BD operativa.

## Corrección V2 — Contactos por función

La ficha corporativa presenta ahora todos los contactos activos agrupados por tipo de contacto (Comercial, Administrativo, Técnico, Facturación, Gerencia y Otro). Cada función muestra su cantidad de contactos y cada contacto conserva la marca de Principal cuando corresponde.
