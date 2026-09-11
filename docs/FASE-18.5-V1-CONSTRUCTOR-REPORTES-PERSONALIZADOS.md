# FASE 18.5 V1 — Constructor de reportes personalizados

## Alcance
- Fuente de datos por módulo.
- Selección de campos.
- Filtros (estructura inicial preparada).
- Ordenamiento ascendente/descendente.
- Vista previa de hasta 100 registros.
- CRUD de reportes personalizados.
- Activación/desactivación.
- Aislamiento por empresa (`empresa_id`).
- Integración conceptual con plantillas y motor documental.

## Fuentes V1
Clientes, Activos, Equipos GPS, Tarjetas SIM, Planes M2M y Consumo M2M.

## BD
Se crea únicamente `reportes_personalizados` mediante migración idempotente. No se recrea la base existente ni se modifican datos previos.

## Permisos
Se crean automáticamente `reportes_personalizados.ver`, `.crear`, `.editar`, `.eliminar` y `.exportar` para el rol Administrador mediante el mecanismo de permisos existente.
