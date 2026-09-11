# FASE 18.2 — Motor documental transversal V1

## Objetivo
Crear un núcleo único para consumir la configuración de marca blanca por `empresa_id` y preparar la generación de documentos para reportes, cotizaciones, facturas, contratos y órdenes.

## V1
- Servicio `services_documentRenderer.js` con modelo documental y render HTML.
- Obtiene identidad y configuración desde `empresa_marca`.
- Aplica logo, colores, encabezado, pie, términos, firma, datos bancarios, moneda y zona horaria.
- Endpoint protegido `GET /api/documentos/preview`.
- Aislamiento multiempresa: administrador puede seleccionar empresa mediante `empresa_id`; demás usuarios usan su propia empresa.
- Auditoría de generación de vista previa.
- Botón de prueba en Reportes.
- No crea ni recrea la BD.
- No genera todavía PDF binario ni Excel/CSV; esas capacidades corresponden a 18.6.

## Prueba
Desde Reportes usar **Vista previa documental**. El navegador abre un documento HTML imprimible que demuestra la aplicación de la marca blanca.
