# FASE 24 — SISTEMA DOCUMENTAL COMPLETO V1

## Objetivo
Consolidar la descarga documental de IT GPS APP y aplicar un único estándar visual y técnico para PDFs.

## Correcciones
- Contratos: corregido `getBrand`/`buildPdf` no importados en `contracts.js`.
- Cotizaciones: descarga PDF con el icono documental aprobado.
- Facturación: descarga PDF con el mismo icono documental aprobado.
- Contratos: descarga PDF con el mismo icono documental aprobado.
- Tooltip y `aria-label` de descarga: `Descargar PDF`.

## Estándar aprobado
El icono `FileText` es el estándar visual para todas las acciones de descarga PDF dentro de listados y fichas.

## Base de datos
No se reinicializa la base de datos. Las migraciones incrementales siguen siendo la única vía de actualización.

## Próxima validación
1. Cotización → PDF.
2. Factura → PDF.
3. Contrato → PDF.
4. Revisión visual y contenido comercial de los tres documentos.
