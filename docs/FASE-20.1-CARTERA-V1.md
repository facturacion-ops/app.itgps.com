# FASE 20.1 — CARTERA V1

## Objetivo
Controlar cuentas por cobrar derivadas de facturas Emitidas/Vencidas, con saldos calculados, pagos parciales o totales y trazabilidad.

## Reglas V1
- Solo facturas Emitidas o Vencidas pueden recibir pagos.
- No se permiten pagos superiores al saldo pendiente.
- Se permiten pagos parciales.
- Al cubrir totalmente una factura, su estado pasa a Pagada.
- El saldo se calcula como total menos pagos Aplicados; no se duplica en la factura.
- Facturas Borrador y Anulada no ingresan a la cartera operativa.
- Los pagos quedan auditados.
- Aislamiento por empresa_id; Administrador puede seleccionar empresa.
- No incluye facturación electrónica DIAN ni contabilidad general en esta fase.

## Pantalla
- KPIs: total facturado activo, total cobrado, por cobrar y vencido.
- Filtros por factura/cliente, estado, empresa y cliente.
- Tabla de cartera con total, pagado, saldo y vencimiento.
- Ficha con historial de pagos.
- Registro de pago con fecha, medio, referencia, valor y observaciones.

## Base de datos
Nueva tabla `pagos_cartera`. La migración es incremental y segura mediante `CREATE TABLE IF NOT EXISTS`/índices. La base existente se conserva.
