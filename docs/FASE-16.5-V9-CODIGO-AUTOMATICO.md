# FASE 16.5 V9 — Guardado y código automático

Corrección sobre V7: el código de cotización se genera automáticamente por empresa con formato COT0001, COT0002, etc. El formulario no permite editarlo. Después de guardar, la cotización se inserta en el listado local, se sincroniza con SQLite y se recalcula el siguiente código. No requiere db:init.
