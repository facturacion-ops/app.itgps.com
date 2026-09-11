# IT GPS APP - Fase 2

## Roles y permisos dinámicos

La versión incluye roles, permisos granulares por módulo y acción, administración desde la interfaz y validación en backend.

### Instalación / actualización
1. Detener el servidor.
2. Respaldar `server/data/itgps.db` si contiene información real.
3. En una instalación de desarrollo limpia, ejecutar `npm run db:init`.
4. Ejecutar `npm run dev`.
5. Ingresar como `admin@itgps.com` / `Cambiar123!`.
6. Abrir `Roles y permisos`.

### Permisos
Los permisos tienen formato `modulo.accion`, por ejemplo `clientes.ver`, `clientes.crear`, `clientes.editar`, `clientes.eliminar`, `clientes.exportar`.

El backend valida permisos, por lo que ocultar un botón en React no es el único control de seguridad.
