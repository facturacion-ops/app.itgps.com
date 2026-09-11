# Fase 21.1 V4 — QA Multiempresa

## Objetivo
Validar el aislamiento financiero por empresa antes del build final y de la prueba contra la BD operacional.

## Controles revisados
- El usuario no Administrador queda limitado a su `empresa_id`.
- El `empresa_id` recibido por query/body no puede ampliar el alcance del usuario.
- Las consultas financieras deben filtrar por empresa cuando el usuario no es Administrador.
- La cadena Empresa → Cliente → Factura → Pago mantiene la empresa consistente.
- Administrador puede consultar una empresa concreta o el consolidado según las reglas existentes.

## Estado
Implementación de controles y documentación preparada para la validación funcional con la BD existente.

## Regla operativa
No ejecutar `npm run db:init`. La BD existente se conserva y las migraciones son incrementales.
