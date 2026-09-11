# IT GPS APP — Fase 4: Clientes

## Objetivo
Construir el primer módulo operativo de IT GPS APP con aislamiento por empresa, permisos RBAC, auditoría y exportación.

## Funcionalidades
- Alta de clientes.
- Edición.
- Activación/inactivación.
- Eliminación protegida por permiso.
- Búsqueda por código, nombre, NIT, contacto, teléfono, correo y ciudad.
- Filtro por estado.
- Filtro por empresa para Administrador.
- Exportación CSV.
- Campos: código, nombre/razón social, tipo, NIT/identificación, contacto, teléfono, correo, ciudad, dirección y observaciones.
- Auditoría de crear, editar y eliminar.
- Aislamiento por `empresa_id` en backend.

## Instalación sobre una base existente
1. Hacer copia de `server/data/itgps.db`.
2. Reemplazar el código por esta versión.
3. Ejecutar `npm install`.
4. Ejecutar `npm run install:all`.
5. Ejecutar `npm run db:init` sin borrar la base.
6. Ejecutar `npm run dev`.

## Validación
- Administrador puede seleccionar empresa al crear/editar clientes.
- Usuario no administrador solo puede operar clientes de su empresa.
- Un usuario sin `clientes.crear`, `clientes.editar`, `clientes.eliminar` o `clientes.exportar` no puede ejecutar esas operaciones ni desde la API.
