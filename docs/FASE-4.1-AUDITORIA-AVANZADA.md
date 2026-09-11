# FASE 4.1 — Auditoría avanzada

## Objetivo
Convertir la auditoría existente de IT GPS APP en un componente de trazabilidad operativa, manteniendo el aislamiento multiempresa.

## Funcionalidades
- Filtros por empresa, usuario, módulo, acción y rango de fechas.
- Búsqueda global por detalle, correo, IP, entidad y registro.
- Resumen de eventos, inicios de sesión, cambios, exportaciones y usuarios.
- Paginación de resultados (25/50/100).
- Vista de detalle del evento.
- Metadatos HTTP: método, ruta y User-Agent.
- Campos preparados para entidad, ID de entidad y comparación de datos antes/después.
- Exportación CSV hasta 10.000 eventos respetando los filtros.
- Administrador puede consultar todas las empresas; los demás usuarios quedan restringidos a su empresa.

## Migración
Se agregan a `auditoria`: `resultado`, `metodo`, `ruta`, `user_agent`, `entidad`, `entidad_id`, `datos_antes`, `datos_despues`, además de índices de consulta. La migración es incremental y no elimina registros existentes.

## Permisos
Se utilizan `auditoria.ver` y `auditoria.exportar`. El rol Administrador recibe los permisos mediante la migración existente.

## Prueba recomendada
1. Iniciar sesión.
2. Entrar en **Auditoría avanzada**.
3. Verificar los KPIs.
4. Filtrar por usuario, módulo y fechas.
5. Abrir `Ver` en un evento.
6. Ejecutar una operación en Clientes, Activos, Equipos GPS, SIM o M2M.
7. Volver a Auditoría avanzada y comprobar que el evento registra usuario, acción, módulo, IP, método y ruta.
8. Exportar CSV.
