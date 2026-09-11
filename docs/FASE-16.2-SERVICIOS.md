# FASE 16.2 — Servicios

## Objetivo
Crear el catálogo maestro de servicios comerciales de IT GPS, independiente de los clientes. El catálogo será reutilizable posteriormente por Planes, Suscripciones, Cotizaciones, Contratos y Facturación.

## Funcionalidades
- Crear servicio.
- Editar servicio.
- Activar / desactivar servicio sin eliminar registros.
- Buscar por código, nombre, categoría y descripción.
- Filtrar por estado y, para Administrador, por empresa.
- Exportar CSV.
- Registrar auditoría de creación, edición, activación y desactivación.

## Datos
- Código
- Nombre del servicio
- Categoría
- Descripción
- Modalidad: Recurrente, Único, Por consumo, Mixto
- Periodicidad: Mensual, Bimestral, Trimestral, Semestral, Anual, Único
- Precio base en COP
- Estado
- Observaciones
- Empresa propietaria

## Regla de datos
Los servicios pertenecen a una empresa. El código es único dentro de cada empresa cuando se informa.

## Relación con FASE 16.1
Clientes y Servicios permanecen desacoplados en esta fase. Un cliente no se modifica al crear un servicio. La relación comercial entre cliente y servicio se implementará en las fases posteriores de Planes/Suscripciones/Cotizaciones/Contratos.

## Base de datos
La tabla `servicios` y sus permisos se crean automáticamente mediante `runMigrations()` al iniciar el servidor. No se requiere ejecutar `npm run db:init` para esta fase sobre la BD actual.
