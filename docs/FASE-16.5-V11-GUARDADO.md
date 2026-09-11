# FASE 16.5 V11 — Corrección de guardado

Se conserva el formulario aprobado. La respuesta POST de cotizaciones devuelve siempre un objeto JSON con ok, id, codigo y cotizacion; el frontend considera confirmada la operación cuando ok=true y refresca el listado.
