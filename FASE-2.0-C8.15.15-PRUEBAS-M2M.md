# FASE 2.0 — C8.15.15 / Pruebas M2MDataglobal

## Base
Este ZIP parte de `IT-GPS-APP-FASE-2.0-C3-C7-PREVIEW-LOCAL-CORREGIDO` y conserva la modalidad local SQLite cuando no existe `DATABASE_URL`.

## Configuración M2MDataglobal
Desde **Integraciones GPS / M2M** crear una integración para la empresa correspondiente:

- Tipo: `M2M` (o `AMBOS` si esa integración también representa un proveedor GPS).
- Proveedor: `M2MDataglobal`.
- URL base: `https://m2mcenter.app/apiclient/v1`.
- Autenticación: `API Key`.
- API Key: la entregada por M2MDataglobal.
- Ruta de consulta: `/sims/simList`.

La API Key se guarda en el backend por integración y no se envía al navegador.

## Multiempresa
Cada registro de `integraciones` pertenece a una `empresa_id`. Por tanto:

- Empresa A puede usar M2MDataglobal con su propia API Key.
- Empresa B puede usar otro proveedor M2M con sus propias credenciales.
- Las sincronizaciones solo modifican SIMs de la empresa de la integración seleccionada.
- No se reutilizan credenciales entre empresas.
- La sincronización no crea relaciones automáticas Cliente → Activo → GPS → SIM.

## Primera prueba
1. Crear la integración M2MDataglobal para una empresa.
2. Guardar la API Key.
3. Ejecutar **Probar conexión**.
4. Si responde correctamente, ejecutar **Sincronizar M2MDataglobal**.
5. Revisar la cantidad de SIM nuevas y actualizadas.
6. Revisar **Gestión M2M → Líneas M2M**.
7. Revisar **Integraciones → Logs**.

## Datos sincronizados en esta etapa
ICCID, MSISDN/número, IMSI, operador, plan, APN, estado y consumo mensual cuando el proveedor lo entrega.

La relación con Equipo GPS se conserva tal como está en IT GPS APP y no se reemplaza automáticamente durante la sincronización.
