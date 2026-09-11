# IT GPS APP — Fase 10: Gestión M2M V1

## Objetivo
Administrar el servicio M2M asociado a las Tarjetas SIM de la Fase 9.

## Alcance V1
- Planes M2M por empresa.
- Asignación de plan a una SIM.
- Día de corte.
- MB incluidos y costo mensual.
- Registro de consumo mensual.
- Cálculo de porcentaje consumido.
- Alertas automáticas al alcanzar los umbrales configurados.
- Atención de alertas.
- Cambio controlado de estado de una línea.
- Historial de cambios de estado.
- Resumen operativo M2M.
- Multiempresa y permisos.

## Flujo
Empresa → SIM → Plan M2M → Consumo → Alertas → Historial

## Base de datos
Se agregan:
- `m2m_planes`
- `m2m_consumos`
- `m2m_alertas`
- `m2m_historial_estados`

A `sim_cards` se agregan `plan_id` y `fecha_corte`.

## Permisos
- `m2m.ver`
- `m2m.crear`
- `m2m.editar`
- `m2m.eliminar`
- `m2m.exportar`

## Nota
La fase está preparada para integrar posteriormente consumo real de operadores, correo y notificaciones Push. Esta V1 utiliza registro manual de consumo para validar el modelo antes de conectar APIs externas.


## Corrección V2
- Se conectó la opción de menú `Gestión M2M` con `M2MPage` en `App`.
- La versión anterior mostraba el mensaje genérico de módulo en preparación porque faltaba la condición `section === "m2m"`.
