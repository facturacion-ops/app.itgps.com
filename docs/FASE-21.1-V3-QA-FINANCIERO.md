# FASE 21.1 V3 — QA FINANCIERO

## Objetivo
Validar la lógica financiera crítica sin modificar la base de datos operacional del usuario.

## Cobertura
- Saldos parciales y totales.
- Pagos aplicados vs. no aplicados.
- Integridad Empresa → Cliente → Factura → Pago.
- Bloqueo de cruces entre empresas.
- Antigüedad de cartera.
- Reporte de integridad.
- Fecha operativa `America/Bogota`.

## Ejecución
Desde la raíz del proyecto:

```bash
npm run qa:financiero
```

La prueba crea una base SQLite temporal, ejecuta las migraciones y elimina la base temporal al finalizar. No utiliza ni modifica `server/data/itgps.db`.

## Corrección adicional incluida
Se unificó el valor por defecto de `fecha_pago` y las validaciones de fecha de facturación con `todayISO()`, evitando volver a depender de UTC directo de JavaScript.

## Estado
QA automatizado incorporado al proyecto. La validación sobre la base real existente queda como paso operacional posterior a la instalación del ZIP.
