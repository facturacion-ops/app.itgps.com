# FASE 11 — Consolidación Operacional V2

## Objetivo
Pasar de diagnóstico a corrección controlada de relaciones entre Activos, Equipos GPS y Tarjetas SIM.

## Acciones
- Asignar equipo GPS a un activo.
- Desasociar/reasignar equipo GPS de un activo mediante el backend.
- Asignar tarjeta SIM a un equipo GPS.
- Desasociar/reasignar SIM de un equipo GPS mediante el backend.
- Validar empresa, estado y asignaciones únicas.
- Registrar cada operación en Auditoría como módulo CONSOLIDACION.

## Seguridad
Las acciones requieren `consolidacion.editar` y respetan la empresa del usuario. Administrador puede operar por empresa seleccionada.

## BD
No requiere tablas nuevas. `npm run db:init` sigue siendo el procedimiento para una instalación nueva.
