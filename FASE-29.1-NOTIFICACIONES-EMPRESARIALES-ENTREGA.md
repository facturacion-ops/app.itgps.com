# IT GPS APP — Fase 29.1 Notificaciones Empresariales V1

## Alcance
Extensión del Centro de Configuración para soportar comunicaciones reales por empresa:
- SMTP independiente por empresa.
- Prueba de conexión SMTP y envío de correo de prueba.
- Credenciales SMTP cifradas en base de datos usando AES-256-GCM derivado de JWT_SECRET.
- Eventos automáticos activables por empresa.
- Plantillas HTML por evento con variables dinámicas.
- Historial de envíos y errores.
- Multiempresa estricto.
- Integración automática inicial: usuario creado, cambio de contraseña, cotización enviada/aceptada y factura emitida.

## Eventos incluidos
USUARIO_CREADO, RECUPERACION_CLAVE, CAMBIO_CLAVE, COTIZACION_CREADA, COTIZACION_ACEPTADA, FACTURA_GENERADA, FACTURA_PROXIMA_VENCER, FACTURA_VENCIDA, PAGO_REGISTRADO, RENOVACION_PROXIMA, CONTRATO_PROXIMO_VENCER.

## Base de datos
Migración no destructiva. Se crean las tablas `notificaciones_smtp`, `notificaciones_eventos`, `notificaciones_plantillas` y `notificaciones_historial`. No requiere `npm run db:init`.

## Instalación sobre la base existente
```bash
npm install
npm run install:all
npm run dev
```

No ejecutar `npm run db:init`.

## Seguridad
Nunca se devuelve la contraseña SMTP al frontend. El envío usa la contraseña descifrada únicamente en memoria. Para producción `JWT_SECRET` debe ser fuerte y estable; si se cambia, las credenciales SMTP cifradas existentes deberán volver a configurarse.

## Extensión Fase 29.2
Se incorpora el envío documental y operativo: cotizaciones/facturas con PDF adjunto, recuperación de contraseña y disparadores automáticos adicionales.
