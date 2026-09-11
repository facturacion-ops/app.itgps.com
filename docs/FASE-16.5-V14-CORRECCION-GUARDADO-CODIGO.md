# FASE 16.5 V14 — Corrección definitiva de guardado y código automático

## Causa encontrada

La ruta `POST /api/cotizaciones` construía una transacción con `db.transaction(...)`, pero no la ejecutaba. La variable `tx` contenía la función de transacción, no el resultado del callback. Por eso la respuesta devolvía `id: null/undefined` y `codigo: undefined`, aunque respondía HTTP 201.

## Corrección

La transacción ahora se ejecuta inmediatamente con `db.transaction(... )()`. El resultado contiene `id`, `codigo`, `subtotal`, `descuento`, `impuestos` y `total`.

## Código automático

El servidor genera el código de forma exclusiva:

- COT0001
- COT0002
- COT0003
- ...

El código enviado desde el formulario no se utiliza para crear una nueva cotización.

## Flujo esperado

Nueva cotización → POST → transacción SQLite → cotización + detalles → confirmación 201 con ID y código → recarga del listado → registro visible.

No se modifica la base de datos existente ni se requiere `npm run db:init` para esta corrección.
