# FASE 18.2 V2 — Corrección de identidad documental

- Se centraliza la identidad principal del documento en `getBrand(empresaId)`.
- `nombre_comercial` se usa como identidad documental principal; si está vacío se usa `nombre_aplicacion` y finalmente el nombre legal de la empresa.
- Se conserva la razón social legal de la empresa como dato independiente.
- La vista documental ahora diferencia `Empresa emisora` (identidad de marca) y `Razón social`.
- Se mantiene el aislamiento por `empresa_id`.
- No se modifica ni incluye la base de datos.
