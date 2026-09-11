# FASE 16.5 V2 — Corrección de Cotizaciones

## Correcciones
- Se corrige el error de guardado asociado al manejo de `detalles`, usando una colección normalizada de ítems de cotización.
- La fecha de vencimiento ahora se selecciona directamente con calendario.
- Se elimina del formulario el campo redundante `Vigencia (días)`.
- La base de datos conserva `vigencia_dias` por compatibilidad; el servidor la calcula a partir de fecha y vencimiento.
- Se valida que el vencimiento no sea anterior a la fecha de cotización.
- Se amplía el modal de cotización.
- El detalle comercial pasa a una cuadrícula horizontal con columnas más amplias y desplazamiento horizontal controlado para pantallas pequeñas.
- Al seleccionar un plan se mantiene la relación con su servicio y se carga el precio del plan.
