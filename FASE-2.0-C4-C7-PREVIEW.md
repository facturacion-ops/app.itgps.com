# IT GPS APP 2.0 — Preview C3 a C7

Esta entrega es una **preview local** del sistema visual aprobado para FASE 2.0.

## Incluye
- C3 — Dashboard 2.0: resumen operativo, estado de plataforma, atención, acciones rápidas y espacio para actividad reciente.
- C4 — Clientes 2.0: dashboard interno de indicadores y distribución de estados sobre los datos disponibles.
- C5 — Prospectos 2.0: conserva el flujo actual y prepara la línea visual para el seguimiento aprobado.
- C6 — Activos 2.0: dashboard interno con estados operacionales y distribución.
- C7 — Equipos GPS 2.0: dashboard interno de estado, disponibilidad, servicio y asignación.
- C8 — Tarjetas SIM/M2M queda para la siguiente iteración; el componente visual base ya está preparado.

## Importante
Esta entrega **no modifica la base de datos** ni ejecuta migraciones. Los indicadores se calculan con los datos que el backend actual ya expone.

Para Clientes, el modelo actual sigue utilizando estado binario Activo/Inactivo; por eso no se inventan estados Suspendido/Baja hasta ampliar el modelo de datos en una fase funcional posterior.
