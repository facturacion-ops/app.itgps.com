# FASE 29 — SEGURIDAD + PRODUCCIÓN V1

## Objetivo
Convertir Configuración en un centro administrativo funcional y establecer una base de seguridad y diagnóstico para producción, conservando la base de datos existente.

## Incluye
- Centro de Configuración por empresa.
- Configuración de identidad, regionalización y parámetros del sistema.
- Política de contraseñas configurable.
- Duración de sesiones configurable.
- Protección contra intentos repetidos de inicio de sesión.
- Bloqueo temporal por correo + IP.
- Invalidación real de sesiones cerradas.
- Cabeceras HTTP de seguridad.
- Rate limiting básico por IP.
- Health Check y diagnóstico de producción.
- Integridad de SQLite y métricas operativas básicas.
- Retención de auditoría y parámetros de respaldo.
- Integración de configuración con marca blanca existente.
- Migraciones no destructivas ejecutadas automáticamente al iniciar el servidor.

## Regla de base de datos
Esta fase NO requiere `npm run db:init`. Las migraciones se ejecutan automáticamente al arrancar el servidor y usan `CREATE TABLE IF NOT EXISTS` / `INSERT OR IGNORE`.

## Seguridad
En producción se exige `JWT_SECRET` mediante variable de entorno. Los tokens de integración GPS/M2M existentes siguen en la base de datos y su cifrado avanzado queda para el endurecimiento adicional previo al despliegue definitivo.

## Verificación recomendada
1. Entrar a Configuración.
2. Verificar Empresa y sistema.
3. Guardar una modificación.
4. Verificar Seguridad.
5. Probar política de contraseña con un usuario de prueba.
6. Verificar Producción y Health Check.
7. Probar cierre de sesión y acceso nuevamente.
8. Confirmar que Multiempresa conserva el aislamiento.
