# IT GPS APP — FASE UI TRANSVERSAL V2

## Objetivo
Unificar la experiencia de las fichas de Nuevo/Editar sin modificar la lógica de negocio ni la base de datos.

## Cambios
- Modal de ficha con barra lateral interna.
- Secciones detectadas automáticamente desde `.form-section-title`.
- Navegación por secciones con desplazamiento suave.
- Encabezado consistente para Nuevo/Editar.
- Área de contenido con scroll independiente.
- Acciones de Guardar/Cancelar visibles mediante barra sticky.
- Responsive: sidebar horizontal en pantallas pequeñas.
- El detalle de auditoría conserva su presentación sin sidebar de edición.

## Compatibilidad
Se mantiene:
- Login
- Roles y permisos
- Multiempresa
- Clientes
- Activos
- Equipos GPS
- Tarjetas SIM
- Gestión M2M
- Reportes
- Gestión
- Auditoría avanzada

## Base de datos
No requiere `db:init` ni cambios de esquema.
