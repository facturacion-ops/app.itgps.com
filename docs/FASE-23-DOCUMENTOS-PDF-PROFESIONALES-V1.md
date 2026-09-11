# FASE 23 — Documentos y PDF profesionales V1

## Objetivo
Consolidar la generación documental comercial de IT GPS APP y aplicar un estándar uniforme de descarga PDF.

## Incluido
- Cotizaciones: PDF con marca blanca, destinatario, fechas, detalle, descuentos y total.
- Facturas: endpoint PDF con detalle, totales, cliente, emisión y vencimiento.
- Contratos: endpoint PDF con cliente, cotización, suscripción, vigencia, estado, valor y observaciones.
- Frontend: icono 📄/documento aprobado para las acciones de descarga PDF.
- Reutilización de identidad de empresa desde `empresa_marca`.

## Base de datos
No se reinicializa la BD. Esta fase es compatible con la BD existente y no requiere `npm run db:init`.

## Validación pendiente en equipo local
1. Descargar PDF de una cotización.
2. Descargar PDF de una factura.
3. Descargar PDF de un contrato.
4. Confirmar logo, identidad, moneda, fechas, detalle y pie de página.
5. Confirmar que el icono PDF es consistente en las tablas.
