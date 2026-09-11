# FASE 18.1 — Configuración de marca por empresa V1

## Objetivo
Crear la primera capa de marca blanca de IT GPS APP, aislada por `empresa_id`, sin recrear ni eliminar la base de datos existente.

## Incluye
- Configuración de nombre de aplicación y nombre comercial.
- Logo principal, logo secundario y favicon almacenados como imagen embebida.
- Colores corporativos principal, secundario y de acento.
- Encabezado y pie de documentos.
- Texto legal y términos y condiciones.
- Datos de firma y datos bancarios.
- Moneda, formato de fecha, formato numérico y zona horaria.
- Vista previa de la identidad visual.
- Auditoría de modificaciones.
- Protección multiempresa en API.
- Migración incremental automática al iniciar el servidor.

## Ubicación
`Empresas` → botón `Marca`.

## Base de datos
Se crea únicamente la tabla `empresa_marca`, con relación 1:1 a `empresas`. No se duplica la información maestra de la empresa.

No ejecutar `npm run db:init` para esta fase. El servidor aplica la migración incremental al iniciar.

## Fuera de alcance en V1
- Generación de PDF.
- Plantillas documentales.
- Reportes personalizados.
- Integración con Cotizaciones, Facturas, Contratos u Órdenes.
- Cambio global del tema de la aplicación.

Estos puntos corresponden a 18.2 en adelante.
