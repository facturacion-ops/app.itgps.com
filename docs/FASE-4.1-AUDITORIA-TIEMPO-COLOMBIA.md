# Corrección de zona horaria — Auditoría avanzada

## Criterio adoptado

IT GPS APP conserva las fechas de auditoría en SQLite usando UTC (`CURRENT_TIMESTAMP`) y las presenta al usuario en la zona horaria oficial de Colombia: `America/Bogota` (UTC-5).

Esto evita mezclar fechas almacenadas en distintas zonas horarias y mantiene una referencia temporal única para auditoría, exportaciones y futuras integraciones.

## Cambios

- La tabla `auditoria` no se modifica ni se migran los registros existentes.
- La vista de Auditoría avanzada convierte la fecha UTC a Colombia.
- El detalle muestra `Fecha (Colombia)`.
- La exportación CSV también entrega la fecha en hora de Colombia.
- Los registros históricos se muestran correctamente sin alterar su valor original.

## Ejemplo

Si SQLite registra:

`2026-08-11 22:54:00 UTC`

en Colombia se presenta como:

`11/08/2026, 17:54:00`

Colombia no utiliza horario de verano, por lo que la conversión es estable en `UTC-5`.
