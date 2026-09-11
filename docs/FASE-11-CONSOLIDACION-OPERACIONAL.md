# FASE 11 — Consolidación operacional V1

## Objetivo

Crear una vista transversal que permita comprobar la relación operativa:

**Cliente → Activo → Equipo GPS → Tarjeta SIM**

sin modificar los módulos aprobados de Clientes, Activos, Equipos GPS, Tarjetas SIM y M2M.

## V1 incluye

- Resumen de clientes, activos, equipos y SIM.
- Activos sin GPS.
- GPS sin SIM.
- GPS sin activo.
- SIM sin GPS.
- Consulta por cliente, placa, código, IMEI, ICCID, marca y modelo.
- Detección de inconsistencias de empresa entre activo/equipo/SIM.
- Detección de referencias a registros inexistentes.
- Permiso `consolidacion.ver`.

## Reglas de consolidación

1. Un activo pertenece a un cliente.
2. Un equipo GPS puede estar asociado a un activo.
3. Una SIM puede estar asociada a un equipo GPS.
4. La empresa debe ser consistente en toda la cadena.
5. Registros retirados/baja no se consideran operativos.
6. Esta fase es de consulta y diagnóstico; no ejecuta correcciones automáticas.
