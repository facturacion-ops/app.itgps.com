# Fase 11 V2.2 — Reutilización de recursos

Se incorporan dos controles para consolidación operacional:

- Los destinos para **Equipo GPS → Activo** solo muestran activos que no tienen otro GPS activo.
- Los destinos para **SIM → Equipo GPS** solo muestran GPS que no tienen otra SIM activa.
- Se agregan acciones **Desvincular GPS** y **Desvincular SIM**.
- La desvinculación libera el recurso y queda registrada en Auditoría.
- No requiere cambios de esquema de SQLite.
