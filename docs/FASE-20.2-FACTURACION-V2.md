# FASE 20.2 — FACTURACIÓN V2

## Objetivo
Implementar facturación recurrente sobre suscripciones activas, con selección de período, generación individual o masiva y control de cierre de períodos.

## Funcionalidades
- Facturación recurrente basada en suscripciones activas y planes con modalidad Recurrente.
- Soporte de periodicidades Mensual, Bimestral, Trimestral, Semestral y Anual.
- Respeto de fecha de inicio, fecha fin y día de facturación de la suscripción.
- Prevención de duplicados por empresa + suscripción + período.
- Generación de facturas en estado Borrador o Emitida.
- Configuración de días para vencimiento al generar.
- Generación de todas las suscripciones elegibles o solo las seleccionadas.
- Lotes de generación con trazabilidad de generadas y omitidas.
- Períodos con estado Abierto/Cerrado.
- Un período cerrado bloquea nueva generación; puede reabrirse con permiso de edición.
- Aislamiento por empresa_id; el Administrador trabaja una empresa a la vez para la generación masiva.
- Integración con Facturación y Cartera existentes mediante la tabla facturas.

## Persistencia incremental
Se agregan a `facturas` las columnas:
- `suscripcion_id`
- `periodo_facturacion`

Y las tablas:
- `facturacion_periodos`
- `facturacion_lotes`
- `facturacion_lote_detalles`

No se recrean tablas existentes ni se eliminan datos.

## Flujo
Suscripción activa → período abierto → evaluación de periodicidad → selección → generación de lote → facturas → cartera.

## Regla de seguridad
Una suscripción no puede generar dos facturas para la misma empresa y período.

## No incluye
- Facturación electrónica DIAN.
- Integración con pasarelas de pago.
- Envío automático por correo.
- Contabilidad.
- Recepción de datos GPS.
