# Corrección UI Transversal V2 — Formularios

## Corrección aplicada
Se corrigió el contenedor de contenido del modal transversal para garantizar que los formularios de Nuevo/Editar se rendericen dentro del panel derecho.

### Se conserva
- Lógica de negocio existente.
- Base de datos y esquema.
- Login y permisos.
- Formularios de Activos, Clientes, Equipos GPS, Prospectos, Tarjetas SIM y Usuarios.
- Barra lateral interna de las fichas.
- Diseño visual V2.

### Cambio
La corrección es exclusivamente de frontend/CSS: se fuerza el ancho, altura, visibilidad y modo de renderizado de los formularios hijos del modal. Los formularios estructurados mantienen dos columnas y los formularios `asset-form` mantienen su layout por secciones.

## Base de datos
No ejecutar migraciones adicionales por esta corrección.
