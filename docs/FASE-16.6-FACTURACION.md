# FASE 16.6 — Facturación

## Objetivo
Generar facturas a partir de cotizaciones aceptadas, manteniendo trazabilidad comercial y evitando facturar una misma cotización más de una vez.

## Reglas V1
- Solo una cotización en estado `Aceptada` puede originar una factura.
- Una cotización aceptada solo puede tener una factura asociada.
- El código de factura lo genera el sistema: `FAC0001`, `FAC0002`, etc.
- La factura hereda cliente, detalle y valores comerciales de la cotización aceptada.
- Las facturas nuevas nacen en estado `Borrador`.
- Solo las facturas `Borrador` pueden editarse.
- Estados: `Borrador`, `Emitida`, `Pagada`, `Vencida`, `Anulada`.
- Una factura `Anulada` no puede cambiar de estado.
- Se registra auditoría de creación, edición y cambio de estado.
- La numeración es independiente por empresa.

## Flujo
Cliente → Cotización Aceptada → Generar factura → Borrador → Emitida → Pagada.

## Base de datos
Se crean `facturas` y `factura_detalles`, con índices por empresa, estado, cliente y cotización.
