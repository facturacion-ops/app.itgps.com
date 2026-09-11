# IT GPS APP — FASE 26

## Facturación Recurrente + Cartera V1

Esta entrega parte de la Fase 25 aprobada y consolida la operación recurrente con control de cartera.

### Funcionalidades
- Configuración por empresa del ciclo recurrente.
- Procesamiento automático del período: genera facturas pendientes sin duplicarlas.
- Actualización automática de facturas vencidas cuando existe saldo pendiente.
- Resumen financiero: suscripciones activas, facturado recurrente, saldo por cobrar y saldo vencido.
- Acción manual para actualizar vencidas.
- Trazabilidad mediante auditoría y lotes de facturación existentes.
- Multiempresa y permisos existentes.
- Migración incremental: no borra ni recrea la base de datos.

### Flujo a probar
Suscripción activa → Procesar ciclo → Factura emitida → Cartera → Vencimiento → Vencida → Pago → Saldo cero → Pagada.

### Instalación / actualización
Ejecutar exactamente:

```bash
npm install
npm run install:all
npm run dev
```

**No ejecutar `npm run db:init`.**
