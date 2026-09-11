# FASE 25 — Flujo Comercial Integral V1

## Objetivo
Conectar visual y operativamente los módulos comerciales existentes sin reemplazarlos:

**Prospecto → Cotización → Aceptación → Cliente → Contrato → Servicio/Plan → Suscripción → Facturación → Cartera → Pago**

## Entregado en V1
- Nuevo concentrador **Flujo comercial**.
- Lectura multiempresa respetando el usuario y la empresa activa.
- Indicadores de prospectos, cotizaciones, aceptaciones, clientes, contratos activos, suscripciones activas y facturas pendientes.
- Seguimiento de cada cliente sobre cotización aceptada, contrato vigente, suscripción activa y factura pendiente.
- Seguimiento de prospectos no convertidos y su última cotización.
- Auditoría de consulta del flujo.
- No se recrea ni se borra ninguna tabla existente.

## Compatibilidad
La fase utiliza las tablas comerciales ya existentes y no requiere `npm run db:init`.

## Validación sugerida
1. Entrar con un usuario con permiso `cotizaciones.ver`.
2. Abrir **Flujo comercial**.
3. Confirmar indicadores y registros.
4. Desde los módulos existentes, continuar las operaciones de conversión, contrato, suscripción, facturación y cartera.
