# Fase 22 V5 — Corrección de creación de cotizaciones

## Error corregido
Al crear una cotización SQLite reportaba:

`SqliteError: 16 values for 17 columns`

La sentencia INSERT declaraba 17 columnas, pero solo tenía 15 parámetros `?` más `CURRENT_TIMESTAMP`.

## Solución
Se ajustó la sentencia a 16 parámetros `?` más `CURRENT_TIMESTAMP`, correspondientes a:

- empresa_id
- cliente_id
- prospecto_id
- codigo
- fecha
- vigencia_dias
- fecha_vencimiento
- responsable_id
- estado
- subtotal
- descuento
- impuestos
- total
- condiciones
- observaciones
- creado_por
- fecha_actualizacion (CURRENT_TIMESTAMP)

No se modifica ni reinicializa la base de datos.
