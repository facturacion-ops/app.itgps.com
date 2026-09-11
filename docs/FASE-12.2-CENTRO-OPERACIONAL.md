# FASE 12.2 — Centro Operacional

Base: Fase 12.1 — Operación GPS aprobada.

## Objetivo
Crear una vista de supervisión operacional sobre la misma BD existente, sin depender de APIs GPS externas.

## Incluye
- Indicadores de Total GPS, Online, Offline, Sin comunicación, Con activo, Con SIM, Mantenimiento y Fuera de servicio.
- Filtros por empresa, conectividad, estado operacional y relación con activo/SIM.
- Búsqueda por IMEI, código, marca, modelo, placa o cliente.
- Tabla operacional consolidada.
- Ficha lateral ordenada para el equipo seleccionado.
- Integración con las relaciones existentes Activo → Equipo GPS → SIM.
- Sin creación de una BD nueva y sin cambios destructivos.

## BD
Se conserva la BD actual de Fase 12.1. No ejecutar `npm run db:init` sobre la BD existente.

## Instalación sobre BD actual
1. Detener el servidor anterior con Ctrl+C.
2. Copiar la BD actual `server/data/itgps.db` al nuevo proyecto, conservando la BD vigente.
3. Ejecutar `npm install`.
4. Ejecutar `npm run install:all`.
5. No ejecutar `npm run db:init`.
6. Ejecutar `npm run dev`.

La Fase 12.2 no requiere nuevas columnas de BD; reutiliza la estructura operacional de Fase 12.1.
