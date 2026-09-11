# PROYECCIÓN DEL PROYECTO — IT GPS APP

## Regla de continuidad
Este documento se incluye en cada ZIP entregado y se actualiza con el estado real del proyecto. La base de datos existente se conserva entre fases; no se ejecuta `npm run db:init` salvo indicación expresa.

## Estado actual
- Base funcional: Fase 21.1 — Centro Financiero V1 Optimizado.
- Corrección en curso: Fase 21.1 V2 — Cierre técnico.
- Vite objetivo: 8.2.2.
- Zona horaria operativa: `America/Bogota`.
- Último pendiente completado: Integridad financiera empresa → cliente → factura → pago.

## Secuencia inmediata
1. **21.1 V2 — Fechas / zona horaria:** unificar la fecha operativa de Colombia en Centro Financiero y Cartera. **En este ZIP:** implementado.
2. **21.1 V2 — Integridad financiera:** validar y endurecer empresa → cliente → factura → pago. **En este ZIP:** ✅ completado mediante validación de aplicación, reporte de inconsistencias y triggers SQLite para nuevas escrituras.
3. **21.1 V2 — QA financiero:** ⏳ siguiente pendiente. Probar saldos, estados, antigüedad, períodos y casos de sobrepago.
4. **21.1 V2 — Multiempresa:** ⏳ validar aislamiento por empresa en endpoints financieros y cartera.
5. **21.1 V2 — Build y migración incremental:** ⏳ comprobar compilación Vite y arranque sobre la BD existente sin recrearla.
6. **Aprobación Fase 21.1:** declarar esta fase estable después del QA.
7. **Última fase:** continuar el desarrollo únicamente sobre la versión aprobada de 21.1.

## Criterios para pasar a la última fase
- Centro Financiero carga sin errores.
- Fecha operativa consistente con `America/Bogota`.
- Totales de facturación y recaudo coinciden con las tablas existentes.
- Cartera excluye Borrador y Anulada.
- Saldo = total - pagos Aplicados.
- Antigüedad calculada con la fecha operativa de Colombia.
- Aislamiento multiempresa validado.
- Build frontend exitoso.
- Migraciones incrementales verificadas.
- No se recrea la base de datos.

## Convención de entregas
Cada ZIP debe conservar:
- código funcional acumulado;
- documentación de fases en `docs/`;
- este archivo de proyección actualizado;
- instrucciones compatibles con la BD existente;
- versión de Vite 8.2.2.


## Actualización Fase 21.1 V3
- Fechas / Zona Horaria: COMPLETADO.
- Integridad financiera: COMPLETADO.
- QA financiero: INCORPORADO EN ESTA VERSIÓN.
- Multiempresa: PENDIENTE.
- Build Vite: PENDIENTE.
- Prueba BD existente: PENDIENTE.
- Última fase: PENDIENTE.

## FASE ÚLTIMA — Consolidación Final V1
- Base: Fase 21.1 V4 Multiempresa
- Estado: iniciada
- Build Vite: pendiente de validación real
- BD existente: pendiente de prueba real
- Cierre: pendiente de aprobación


## FASE 22 — Ajustes Comerciales, UI y Cotizaciones
- Estado: iniciada
- UI uniforme y formularios anchos: incluido
- Cotización de prospectos: incluido
- Códigos automáticos: incluido
- PDF de cotizaciones: incluido
- Base real de producción: pendiente de preparación controlada

## FASE 22 — Ajustes UI y Flujo Comercial V1
- Estado: en desarrollo
- Menú y colores uniformes: incluido
- Formularios Nuevo/Editar más amplios: incluido
- Cotizaciones para Prospectos: incluido
- Códigos automáticos y consecutivos: incluido para Prospectos y Cotizaciones
- PDF de cotizaciones: incluido
- Base de datos de producción real: pendiente de preparación controlada
- Datos de prueba: no se deben migrar a producción


## Fase 22 V2 — Corrección de arranque
- Corregido el parser JSX de Cotizaciones (botones adyacentes).
- Corregida la migración de `cotizaciones.cliente_id` para permitir cotizaciones de prospectos sin modificar `sqlite_master` mediante prepared statement.
- Build Vite real pendiente de ejecutar en el entorno con dependencias instaladas.

### Fase 22 V2 — Corrección de arranque
- Corregir migración SQLite de cotizaciones para evitar modificación directa de `sqlite_master`.
- Mantener compatibilidad con BD existente y permitir cotizaciones asociadas a prospectos.
- Mantener Vite 8.2.2 y corregir arranque del frontend ya validado por el servidor Vite.


## Fase 22 V4 — Corrección Prospectos y listado de Cotizaciones
- Corregido error SQL `incomplete input` al generar automáticamente el código de prospecto.
- Corregida la consulta de listado/exportación de Cotizaciones para incluir cotizaciones dirigidas a Prospectos.
- Se conserva la BD existente y no se requiere `npm run db:init`.
- Pendiente: prueba funcional completa Prospecto → Cotización → PDF → conversión a Cliente.

## Corrección Fase 22 V5 — Cotizaciones
- Corregido el INSERT de cotizaciones para incluir los 16 valores parametrizados requeridos antes de `fecha_actualizacion`.
- Se mantiene el flujo Cliente/Prospecto, códigos automáticos y PDF.
- No requiere reinicializar la base de datos.

## Fase 22 V6 — Corrección PDF y estándar maestro de modales
- Corrección del flujo de descarga PDF de Cotizaciones: función de descarga ubicada en el ámbito correcto y descarga Blob robusta con autenticación.
- Estandarización visual: todos los modales no compactos usan ahora un ancho máximo común de 1440 px y ocupan el ancho disponible de forma responsiva.
- Se conserva la BD existente; no requiere `npm run db:init`.

## Fase 22 V7 — Flujo Prospecto → Cotización
- Corregido el botón “Crear cotización para prospecto” cuando se ejecuta desde el módulo Prospectos.
- El evento ahora es recibido por `App`, que navega al módulo Cotizaciones y entrega el prospecto seleccionado al formulario.
- El formulario de Cotizaciones abre automáticamente con el prospecto precargado y la empresa correspondiente.
- Se valida el permiso `cotizaciones.crear` para mostrar la acción en Prospectos.
- Se conserva la BD existente y no requiere `npm run db:init`.
- Build Vite completo pendiente de validación en un entorno con las dependencias frontend instaladas; el entorno de generación no logró completar la instalación antes del timeout.


## FASE 23 — Documentos y PDF profesionales V1
- Estado: iniciada
- PDF de Cotizaciones: consolidado con identidad de marca blanca y detalle comercial.
- PDF de Facturas: incorporado con detalle, totales, cliente, fechas y marca.
- PDF de Contratos: incorporado con datos contractuales, vigencia, valor y condiciones.
- Icono PDF: estándar aprobado y aplicado a las acciones de descarga.
- Motor documental: se reutiliza la identidad configurada por empresa.
- Plantillas documentales: base existente conservada para evolución posterior.
- BD existente: se conserva; no requiere `npm run db:init`.
- Siguiente objetivo: validar visualmente los PDFs y después cerrar el flujo comercial integral.


## FASE 24 — Sistema Documental Completo V1
- Estado: en desarrollo
- Corrección del PDF de Contratos: completada; `getBrand` y `buildPdf` quedan importados correctamente.
- Descarga PDF de Cotizaciones, Facturas y Contratos: unificada con el icono documental aprobado (`FileText`).
- Botones PDF: tooltip y accesibilidad estandarizados.
- Motor documental: se conserva y se centraliza sobre `getBrand` + `buildPdf`.
- BD existente: se conserva; no requiere `npm run db:init`.
- Vite objetivo: 8.2.2.
- Siguiente control: prueba funcional de los tres PDFs y revisión visual del documento generado.

---

## ESTADO ACTUAL — FASE 25

- Fase 24 — Sistema documental completo V1: **APROBADA**.
- Fase 25 — Flujo Comercial Integral V1: **ENTREGADA PARA PRUEBA**.
- Fase 25 agrega un concentrador de flujo comercial que consulta Prospectos, Cotizaciones, Clientes, Contratos, Suscripciones y Facturación sin duplicar datos.
- La base de datos existente se conserva; no se ejecuta `npm run db:init`.

## Actualización — Fase 28
- Fase 25 — Flujo Comercial Integral V1: APROBADA de punta a punta.
- Fase 26 — Facturación Recurrente + Cartera V1: APROBADA.
- Fase 27 — Centro de Monitoreo GPS: reservada para etapa final por arquitectura multi-plataforma.
- Fase 28 — Integraciones GPS / M2M V1: implementada como capa agnóstica por empresa.
- Fase 29 — Seguridad + Producción: siguiente etapa de endurecimiento, secretos, backups y preparación productiva.
- Fase 30 — QA + Certificación final: cierre técnico.
