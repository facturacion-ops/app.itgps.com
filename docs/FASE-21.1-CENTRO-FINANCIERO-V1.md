# FASE 21.1 — Centro Financiero V1

## Objetivo
Dashboard financiero consolidado de facturación, recaudo, cartera y vencimientos.

## Alcance
- Filtro por período y, para Administrador, por empresa.
- Facturado del período.
- Recaudado del período usando `pagos_cartera` en estado `Aplicado`.
- Cartera actual: por cobrar, vencido, por vencer y clientes con saldo.
- Antigüedad: por vencer, 0–30, 31–60, 61–90 y +90 días.
- Estado de facturas del período.
- Movimiento diario de recaudo.
- Últimos 10 pagos aplicados.

## Seguridad
- Nuevo permiso: `financiero.ver`.
- Respeta `empresa_id`.
- Administrador puede consultar todas las empresas o una empresa concreta.
- No crea ni modifica movimientos financieros desde esta V1.

## API
`GET /api/financiero?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&empresa_id=ID`

## Base de datos
V1 reutiliza `facturas` y `pagos_cartera`. No crea tablas nuevas. La migración únicamente registra los permisos del módulo `financiero`.

## Criterios de aceptación
1. El módulo abre sin error.
2. El período actual carga automáticamente.
3. Administrador puede seleccionar empresa.
4. Los totales de facturación y recaudo coinciden con las tablas existentes.
5. La cartera excluye facturas Borrador y Anulada.
6. El saldo se calcula como total menos pagos Aplicados.
7. La antigüedad se calcula contra la fecha actual del servidor.
8. Un usuario no Administrador no puede consultar otra empresa mediante `empresa_id`.
9. No se ejecuta `db:init`.

## V2 — Corrección de fechas / zona horaria
La fecha operativa del Centro Financiero y la Cartera se calcula con `America/Bogota` mediante una utilidad centralizada del backend. Se eliminan las comparaciones financieras basadas en `date('now','-5 hours')` y se evita depender de la zona horaria del servidor. El frontend del Centro Financiero también calcula el período inicial con `America/Bogota`.
