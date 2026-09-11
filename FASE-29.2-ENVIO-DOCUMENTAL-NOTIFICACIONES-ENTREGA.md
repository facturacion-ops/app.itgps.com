# IT GPS APP — Fase 29.2 — Envío documental por correo V1

## Objetivo
Integrar el motor de notificaciones empresariales con los documentos y eventos operativos de IT GPS APP.

## Incluye
- Envío manual de cotizaciones por correo.
- Envío manual de facturas por correo.
- PDF de cotización adjunto.
- PDF de factura adjunto.
- Plantilla correspondiente al evento de correo.
- Registro del envío en `notificaciones_historial`.
- Envío automático al pasar una cotización a `Enviada` o `Aceptada`.
- Envío automático al emitir una factura.
- Aviso automático de pago registrado.
- Avisos programados de facturas próximas a vencer y vencidas.
- Avisos programados de renovaciones y contratos próximos a vencer.
- Creación de usuario: notificación automática.
- Cambio de contraseña: notificación automática.
- Recuperación de contraseña con token temporal de 30 minutos.
- Enlace de recuperación enviado mediante la plantilla `RECUPERACION_CLAVE`.
- Cifrado de credenciales SMTP.
- Aislamiento por empresa.

## Seguridad
- Las contraseñas SMTP no se exponen al frontend.
- El token de recuperación se almacena como hash y expira.
- No se envían contraseñas en texto plano por correo.
- Las acciones respetan el aislamiento Multiempresa.

## Base de datos
Migración no destructiva. Se agrega la tabla `recuperacion_claves` y sus índices. Las tablas existentes no se recrean ni se eliminan.

## Instalación
Conservar la base de datos existente. No ejecutar `npm run db:init`.

```bash
npm install
npm run install:all
npm run dev
```
