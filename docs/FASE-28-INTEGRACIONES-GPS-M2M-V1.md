# FASE 28 — Integraciones GPS / M2M V1

## Objetivo
Crear una capa de integración multiempresa y agnóstica de proveedor para que cada empresa pueda conectar una o varias plataformas GPS y/o proveedores M2M sin acoplar el núcleo de IT GPS APP a una plataforma específica.

## Alcance implementado
- Catálogo de integraciones por empresa.
- Tipos GPS, M2M y AMBOS.
- Conector REST JSON genérico.
- Autenticación Bearer o API Key.
- URL base, rutas de dispositivos y consumo M2M.
- Prueba de conexión con timeout configurable.
- Sincronización genérica de dispositivos GPS desde respuestas JSON comunes.
- Mapeo de identificador externo ↔ equipo GPS de IT GPS APP cuando coincide el IMEI.
- Webhook de entrada agnóstico para posiciones/eventos GPS y consumos M2M.
- Registro de operaciones y errores de integración.
- Regeneración de token de webhook.
- Multiempresa y permisos.
- Auditoría de creación, edición, pruebas y sincronizaciones.
- UI con pestañas Resumen, Conectores, Mapeos y Logs.

## Modelo de arquitectura

IT GPS APP → Integración por empresa → Plataforma GPS / proveedor M2M

Una empresa puede tener múltiples conectores y otra empresa puede usar proveedores completamente distintos.

## API principal
- `GET /api/integraciones/resumen`
- `GET /api/integraciones`
- `POST /api/integraciones`
- `PUT /api/integraciones/:id`
- `DELETE /api/integraciones/:id`
- `POST /api/integraciones/:id/probar`
- `POST /api/integraciones/:id/sincronizar`
- `POST /api/integraciones/:id/regenerar-webhook`
- `GET /api/integraciones/mapeos`
- `GET /api/integraciones/logs/listado`
- `POST /api/integraciones/webhook/:token`

## Webhook GPS — ejemplo
```json
{
  "tipo": "POSITION",
  "imei": "123456789012345",
  "lat": 6.2442,
  "lng": -75.5812,
  "velocidad": 42,
  "ignicion": true,
  "bateria": 87,
  "timestamp": "2026-09-05T19:00:00-05:00"
}
```

## Webhook M2M — ejemplo
```json
{
  "tipo": "M2M_CONSUMO",
  "iccid": "8957XXXXXXXXXXXXXXX",
  "periodo": "2026-09",
  "mb_consumidos": 1532.5
}
```

## Seguridad
Los tokens de integración y webhook quedan aislados por empresa y nunca se mezclan entre empresas. La autenticación de la API externa se utiliza únicamente desde el servidor. La cifrado/gestión avanzada de secretos debe completarse en la Fase 29 — Seguridad + Producción.

## Base de datos
La migración es incremental y utiliza `CREATE TABLE IF NOT EXISTS` / índices. No requiere `npm run db:init` y no elimina información existente.

## Criterio de aceptación
La fase queda lista para probar cuando el usuario pueda:
1. Crear una integración GPS por empresa.
2. Probar su conexión.
3. Ejecutar sincronización y observar mapeos.
4. Recibir un evento GPS por webhook.
5. Crear una integración M2M independiente.
6. Registrar consumo por webhook.
7. Consultar logs y errores.
8. Confirmar aislamiento multiempresa.
