# FASE ÚLTIMA — Consolidación Final V1

## Base
Continúa desde Fase 21.1 V4 — Multiempresa.

## Objetivo
Cerrar el proyecto sobre la base actual, preservando la BD existente y evitando reconstrucciones.

## Alcance
1. Consolidación de módulos y navegación existentes.
2. Revisión final de permisos y aislamiento multiempresa.
3. Validación de migraciones incrementales.
4. Preparación y validación del build de producción.
5. Validación final contra la BD operacional existente.
6. Revisión final de documentación y proyección.
7. Checklist de salida a producción.

## Regla de base de datos
NO ejecutar `npm run db:init`.
La base actual se conserva. Solo se ejecutan migraciones incrementales cuando correspondan.

## Criterio de cierre
- Build de frontend finalizado correctamente.
- Backend inicia correctamente.
- Migraciones sin recrear ni destruir la BD.
- Aislamiento multiempresa validado.
- QA financiero aprobado.
- Centro Financiero conserva sus controles.
- Sin errores bloqueantes de consola/API.

## Nota
Esta fase es de consolidación y validación. No se introducen funcionalidades ajenas al cierre sin registrarlas como cambio adicional.
