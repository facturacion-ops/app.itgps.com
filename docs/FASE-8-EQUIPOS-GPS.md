# IT GPS APP — Fase 8: Equipos GPS

Construida sobre `IT-GPS-APP-Fase-2-3D.zip`.

Relación: Empresa → Cliente → Activo → Equipo GPS.

Incluye:
- IMEI único
- Código interno y número de serie
- Fabricante, marca, modelo y tipo
- Firmware y protocolo
- Estado operativo
- Fechas de compra, instalación y garantía
- Asignación opcional a Activo
- Multiempresa con aislamiento
- RBAC: equipos.ver/crear/editar/eliminar/exportar
- Búsqueda, filtros y CSV
- Auditoría
- Retiro lógico del equipo

No eliminar `server/data/itgps.db`; ejecutar la migración con la BD existente.


## Corrección Fase 8 v5
- El catálogo de activos usa `tipo_activo` (nombre real de la columna) y lo expone como `tipo`.
- El endpoint `/api/equipos/catalogos` requiere `equipos.ver`, porque es una consulta de lectura; crear equipos sigue requiriendo `equipos.crear`.
