# FASE 2.0 — C9.2 Centro Financiero 2.0

## Objetivo
Convertir el Centro Financiero en un centro de control ejecutivo para facturación, recaudo, cartera y prioridades de cobro.

## Cambios
- Resumen ejecutivo del período.
- Facturado, recaudado, por cobrar y vencido.
- Porcentaje de recaudo sobre facturación.
- Factura promedio del período.
- Porcentaje de cartera vencida.
- Antigüedad de saldos.
- Estado de documentos del período.
- Movimiento diario de recaudo.
- Clientes con mayor saldo pendiente.
- Últimos pagos aplicados.
- Requiere atención.
- Fecha operativa `America/Bogota`.

## Multiempresa
- Administrador puede consultar todas las empresas o una empresa concreta.
- Usuarios no Administradores quedan limitados a su `empresa_id`.
- Los clientes con mayor saldo se calculan sobre el mismo alcance empresarial del resto del dashboard.

## Base de datos
No se crean tablas nuevas. Se reutilizan `facturas`, `pagos_cartera` y `clientes`.

## API
Se mantiene `GET /api/financiero?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&empresa_id=ID`.

## Pruebas
1. Abrir Centro Financiero.
2. Confirmar período actual.
3. Cambiar período y aplicar.
4. Como Administrador, consultar todas las empresas y luego una empresa concreta.
5. Como usuario de empresa, verificar que no puede consultar otra empresa.
6. Revisar clientes con mayor saldo.
7. Revisar pagos recientes y movimiento diario.
8. Confirmar que no se ejecuta `db:init`.
