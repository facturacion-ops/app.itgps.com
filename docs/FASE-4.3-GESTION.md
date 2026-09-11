# FASE 4.3 — Gestión V1

Construida sobre la Fase 4.2 Reportes aprobada.

## Funcionalidades
- Tareas, actividades, seguimientos, pendientes y vencimientos.
- Estados: Pendiente, En proceso, En espera, Completado, Cancelado.
- Prioridades: Baja, Media, Alta, Crítica.
- Responsable.
- Relación con Empresa, Cliente, Activo, Equipo GPS y Tarjeta SIM.
- Fecha de inicio y fecha límite.
- Observaciones y descripción.
- Filtros por texto, empresa, estado y prioridad.
- Indicadores de total, pendientes, en proceso, vencidas y completadas.
- Cambio rápido a Completado.
- Auditoría avanzada de crear, editar, cambio de estado y eliminar.
- Multiempresa respetando permisos.

## Instalación
Conservar la BD existente. Ejecutar `npm install` y luego `npm run dev`.
La migración de `server/src/db/migrate.js` crea `gestion_tareas` automáticamente al iniciar el servidor.

No eliminar `server/data/itgps.db`.
