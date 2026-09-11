# FASE 16.1 V2 — Corrección de lógica de clientes y contactos

## Objetivo
Separar completamente la ficha del cliente del formulario de contactos.

## Reglas
- El formulario Nuevo/Editar cliente administra solamente datos del cliente.
- Nuevo contacto se abre desde la Ficha del cliente en un modal independiente.
- El `cliente_id` se asigna automáticamente al contacto; el usuario no lo selecciona.
- Los contactos se agrupan por función.
- Puede existir un contacto principal por función.
- Para clientes Persona, el cliente puede ser su propio contacto general; no se crea un contacto duplicado automáticamente.
- Al crear una Empresa o Entidad pública con un contacto general informado, se registra una única vez como contacto corporativo principal de función Otro.
- El botón de clientes cambia de eliminar físicamente a activar/desactivar, conservando relaciones e historial.

## Base de datos
Esta corrección no requiere una migración nueva. Se conserva la BD actual.

## Ejecución
Desde la carpeta `f11fix`:

```powershell
npm install
npm run install:all
npm run dev
```

No ejecutar `npm run db:init` para esta versión.
