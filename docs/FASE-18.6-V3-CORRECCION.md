# FASE 18.6 V3 — Corrección integral

## Corrección aplicada
- Se amplió el límite del parser JSON de Express a 12 MB.
- Se amplió el parser URL-encoded a 12 MB.
- Se agregó respuesta controlada para HTTP 413 PayloadTooLargeError.
- Se mantiene la persistencia de marca blanca por empresa.
- Se mantiene el aislamiento por `empresa_id`.
- No se recrea ni modifica la base de datos.

## Motivo
La configuración de marca blanca permite cargar imágenes como Data URL. Con el límite predeterminado de Express, una solicitud con uno o más logos podía superar el límite y provocar `PayloadTooLargeError`.

## Siguiente validación
1. Guardar marca blanca con logo principal/secundario/favicon.
2. Generar el mismo reporte.
3. Exportar PDF.
4. Exportar Excel.
5. Exportar CSV.
