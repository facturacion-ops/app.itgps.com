# FASE 16.1 — CLIENTES CORPORATIVOS V1

## Objetivo
Extender el módulo Clientes aprobado para soportar clientes corporativos sin duplicar el catálogo existente.

## Alcance
- Tipo de cliente.
- Razón social.
- Nombre comercial.
- NIT y dígito de verificación.
- Actividad económica.
- Departamento, ciudad y dirección.
- Sitio web.
- Contactos corporativos.
- Contactos Comercial, Administrativo, Técnico, Facturación, Gerencia u Otro.
- Contacto principal.
- Estado de contacto.
- Auditoría de creación, edición y desactivación de contactos.
- Filtros y exportación mantienen compatibilidad con Clientes.

## BD
Migración incremental: `server/migrar-fase16-1.cjs`.
No ejecutar `npm run db:init` sobre la BD operativa actual.

## Regla de instalación
Conservar `server/data/itgps.db` actual y ejecutar la migración específica desde `server`:
`node migrar-fase16-1.cjs`
