# IT GPS APP — Guía de despliegue en Vercel

Este paquete parte de **IT-GPS-APP-FASE-2.0-C9.1-C9.2-CENTRO-FINANCIERO-V2** y está preparado para el flujo Vercel + PostgreSQL/Neon.

## Regla principal de datos

La información del ZIP anterior era de pruebas. **No se debe migrar esa base a Vercel.** El archivo SQLite local de datos fue retirado de este paquete de despliegue.

La base nueva debe comenzar vacía y se debe crear únicamente:
- 1 empresa inicial: IT GPS
- roles/permisos del sistema
- 1 usuario Administrador
- configuración base de la empresa

El script `server/scripts/bootstrap-empty-postgres.cjs` se niega a ejecutar si detecta usuarios o empresas existentes, para evitar borrar datos por accidente.

## Arquitectura

- Frontend: React + Vite, publicado como archivos estáticos por Vercel.
- Backend: Express como Vercel Function en `/api/index.js`.
- Base de datos: PostgreSQL, recomendado mediante Neon conectado desde Vercel.
- Las llamadas del frontend usan `/api/...`, por lo que no se necesita dejar una URL localhost en producción.

## Orden recomendado

1. Crear/importar el repositorio en GitHub.
2. Importar el repositorio en Vercel.
3. Crear/conectar PostgreSQL (Neon).
4. Configurar variables de entorno.
5. Inicializar la base vacía con el script de bootstrap.
6. Hacer el deploy de producción.
7. Probar `/api/health` y luego iniciar sesión con el administrador.
8. Verificar que Clientes, Prospectos, Activos, Equipos GPS, SIM/M2M, Facturación y Centro Financiero aparezcan vacíos.

## Variables de entorno

### Production

- `DATABASE_URL` = cadena PostgreSQL proporcionada por Neon/Vercel.
- `JWT_SECRET` = secreto largo y aleatorio.
- `FRONTEND_ORIGIN` = URL final de Vercel, por ejemplo `https://it-gps-app-xxxxx.vercel.app`.
- `PGSSL` = dejar sin definir salvo que el proveedor indique otra cosa.

### Solo para inicialización local/administrada

- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`
- `INITIAL_ADMIN_NAME`

No guardar contraseñas reales en GitHub ni en archivos `.env` versionados.

## Comando de inicialización segura

Desde la raíz del proyecto, con `DATABASE_URL` apuntando a la base NUEVA:

```bash
INITIAL_ADMIN_EMAIL='admin@itgps.com' INITIAL_ADMIN_PASSWORD='CAMBIAR_POR_UNA_CLAVE_SEGURA' INITIAL_ADMIN_NAME='Administrador' node server/scripts/bootstrap-empty-postgres.cjs
```

Después del primer acceso, cambiar la contraseña del administrador.

## Pruebas

```bash
npm install
npm run build
```

Para desarrollo local:

```bash
npm run install:all
npm install
npm run dev
```

No ejecutar `npm run db:init` para la base PostgreSQL de producción.

## Repetición del proceso

Para una nueva instalación de prueba, crear una base PostgreSQL nueva, repetir las variables y ejecutar el bootstrap. No reutilizar una base con datos reales o de otra empresa.
