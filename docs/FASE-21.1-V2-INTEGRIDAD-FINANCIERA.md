# FASE 21.1 V2 — Integridad financiera

## Objetivo

Garantizar que la relación financiera respete siempre:

`empresa → cliente → factura → pago`

## Implementado en esta versión

- Validación centralizada en `server/src/utils/financialIntegrity.js`.
- Reporte de inconsistencias mediante `GET /api/financiero/integridad`.
- Triggers SQLite para impedir nuevas facturas con cliente de otra empresa.
- Triggers SQLite para impedir nuevos pagos que no coincidan con empresa, factura y cliente.
- Índices compuestos para acelerar las comprobaciones.
- Validación adicional antes de registrar pagos desde Cartera.
- La migración es incremental: no recrea tablas ni modifica registros existentes.

## Compatibilidad con la BD existente

Los triggers protegen nuevas escrituras. Los datos históricos no se corrigen automáticamente.

El endpoint de integridad permite detectar inconsistencias existentes antes del QA financiero.

## Criterio de aprobación

El reporte debe devolver:

- `ok: true`
- `total_inconsistencias: 0`
- `facturas_inconsistentes: []`
- `pagos_inconsistentes: []`

La prueba automatizada sobre una BD real existente forma parte del siguiente pendiente de QA.
