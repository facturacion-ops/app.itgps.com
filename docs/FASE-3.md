# IT GPS APP — Fase 3

## Multiempresa
- Empresas con alta, edición y estado.
- Usuarios administradores pueden asignar usuarios a empresas.
- Usuarios no administradores permanecen limitados a su empresa.
- Dashboard y datos operativos existentes ya filtran por `empresa_id`.

## Auditoría
- Login y logout/sesiones.
- Alta, edición, estado y contraseña de usuarios.
- Cambios de roles/permisos.
- Alta y edición de empresas.
- Consulta limitada por empresa salvo Administrador.

## Reglas
- No se elimina físicamente una empresa: se inactiva.
- No se permite al usuario desactivar su propia cuenta.
- El backend valida permisos y empresa, no solamente el frontend.

## Próximo bloque
Módulos operativos: Clientes → Prospectos → Activos → Equipos GPS → SIM → Reportes/Gestión.
