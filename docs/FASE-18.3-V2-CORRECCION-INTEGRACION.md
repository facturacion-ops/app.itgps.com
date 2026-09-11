# FASE 18.3 V2 — Corrección de integración

Se corrige la integración del módulo **Plantillas de documentos** en la navegación y permisos.

## Corrección

Se agregó el módulo `plantillas_documentos` al catálogo de permisos generado por la migración automática. El rol Administrador recibe automáticamente sus permisos mediante la lógica existente de `rol_permisos`.

## Resultado esperado

En ADMINISTRACIÓN debe aparecer:

- Configuración
- Usuarios
- Roles y permisos
- Empresas
- Plantillas de documentos
- Auditoría avanzada

La ruta funcional es `plantillas_documentos` y utiliza `/api/plantillas-documentos`.

## Base de datos

No se recrea la BD. La migración existente usa `CREATE TABLE IF NOT EXISTS` para `plantillas_documentos` y ahora también genera los permisos faltantes con `INSERT OR IGNORE`.
