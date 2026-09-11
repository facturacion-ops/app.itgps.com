# FASE 2.0 — C8.15.15 Integración M2MDataglobal

## Objetivo
Integrar M2MDataglobal mediante la capa de integraciones existente, manteniendo IT GPS APP multiempresa. Cada empresa puede tener su propio proveedor M2M y sus propias credenciales.

## Arquitectura
Empresa → Integración M2M → Adaptador M2MDataglobal → API REST M2MDataglobal.

Las credenciales no se exponen al frontend. La sincronización se ejecuta desde el backend usando la integración seleccionada.

## Endpoints implementados
- `GET /sims/simList`
- `GET /sims/simDetails/icc/{icc}`
- `GET /sims/simDetails/msisdn/{msisdn}`
- `GET /sims/simDetails/imei/{imei}`
- Pruebas GSM/GPRS, reset, SMS y custom fields quedan disponibles en el adaptador para la siguiente etapa de acciones controladas.

## Headers
- `X-API-KEY` por empresa/integración.
- `User-Agent`.

## Sincronización
- ICCID es el identificador principal.
- Crea la SIM si no existe para la empresa, sin crear relaciones automáticas con cliente, activo o GPS.
- Actualiza SIM existente por `empresa_id + iccid`.
- Intenta asociar el plan existente por nombre y empresa.
- Registra `consumptionMonthlyData` en el consumo del mes cuando viene disponible.
- No altera las relaciones `equipo_id` existentes.
- Registra operación y auditoría por empresa.

## Multiempresa
La integración se selecciona por `integraciones.id` y todas las consultas/escrituras quedan limitadas a `integraciones.empresa_id`. Un proveedor configurado para una empresa no puede utilizar las credenciales de otra.

## Configuración de prueba
En **Integraciones GPS / M2M**, crear una integración: tipo `M2M` o `AMBOS`, proveedor `M2MDataglobal`, URL base `https://m2mcenter.app/apiclient/v1`, autenticación `API Key` y la API Key entregada por el proveedor.
