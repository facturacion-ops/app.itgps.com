# FASE 20.1 V2 — Botón Nueva factura

## Motivo
En la pantalla de Facturación no se mostraba un botón general para iniciar una nueva factura cuando no existían cotizaciones aceptadas pendientes visibles en la tabla.

## Corrección
- Se agregó el botón **Nueva factura** en la cabecera del módulo Facturación.
- El botón respeta el permiso `facturas.crear`.
- Abre un selector de cotizaciones aceptadas pendientes de facturar.
- Si no existen cotizaciones disponibles, se informa claramente dentro del modal.
- Al seleccionar una cotización se conserva el flujo existente de generación de factura.
- No se modifica la regla de negocio: una factura V1 se origina desde una cotización `Aceptada` sin factura asociada.
- No se modifica la base de datos ni se agrega migración.
- Se conserva el aislamiento multiempresa.

## Resultado esperado
La pantalla debe mostrar:

`[ + Nueva factura ]`

junto al encabezado de Facturación.

El botón abre **Nueva factura** y permite seleccionar el origen cuando existen cotizaciones aceptadas pendientes.
