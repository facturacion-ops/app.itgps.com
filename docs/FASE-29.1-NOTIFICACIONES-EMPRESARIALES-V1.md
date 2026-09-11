# Fase 29.1 — Notificaciones Empresariales V1

Esta fase convierte la pestaña Notificaciones en un componente operativo real del Centro de Configuración.

### SMTP por empresa
Cada empresa tiene host, puerto, seguridad, usuario, contraseña cifrada, remitente, reply-to y estado. Incluye verificación de conexión y correo de prueba.

### Eventos automáticos
Los eventos se crean automáticamente para cada empresa y pueden activarse/desactivarse sin afectar a otras empresas.

### Plantillas
Cada evento puede tener plantillas HTML con asunto y variables `{{cliente}}`, `{{numero}}`, `{{total}}`, `{{empresa}}`, `{{nombre}}`, `{{vencimiento}}`, entre otras.

### Integraciones automáticas iniciales
- Usuario creado → correo de bienvenida.
- Cambio de contraseña → aviso.
- Cotización enviada → correo al cliente.
- Cotización aceptada → confirmación.
- Factura emitida → correo al cliente.

La recuperación de clave y los recordatorios programados quedan preparados mediante eventos/plantillas para conectarse al motor correspondiente en las siguientes iteraciones.
