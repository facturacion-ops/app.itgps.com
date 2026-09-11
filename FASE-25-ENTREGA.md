# IT GPS APP — FASE 25

## Flujo Comercial Integral V1

Esta entrega parte de la base aprobada de Fase 24 y agrega el concentrador de seguimiento comercial.

### Instalación / actualización

Ejecutar exactamente en este orden:

```bash
npm install
npm run install:all
npm run dev
```

**No ejecutar `npm run db:init` en esta actualización.**

### Punto principal
En el menú **COMERCIAL** aparece **Flujo comercial**. El módulo muestra el avance de:

Prospecto → Cotización → Aceptación → Cliente → Contrato → Suscripción → Facturación.

La información se consulta directamente de las tablas existentes y respeta la empresa del usuario.
