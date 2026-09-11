# IT GPS APP — Render Piloto

Esta versión prepara IT GPS APP para un **piloto temporal en Render** con un único Web Service que sirve el frontend y la API.

## Importante antes de desplegar

- Esta edición mantiene **SQLite** para conservar la arquitectura actual durante el piloto.
- El almacenamiento de un Web Service Free de Render es **efímero**. No debe considerarse almacenamiento permanente de datos.
- No ejecutar `npm run db:init` durante la publicación.
- Para una operación empresarial permanente se deberá migrar la capa de datos a un almacenamiento persistente (por ejemplo PostgreSQL) antes de considerar este entorno producción definitiva.
- Render Free no permite tráfico SMTP saliente por los puertos 25, 465 y 587. Si el proveedor SMTP actual usa uno de esos puertos, el envío de correo desde Render Free no funcionará. Para el piloto habrá que usar un proveedor/puerto SMTP permitido (por ejemplo 2525 si el proveedor lo soporta) o una API de correo por HTTPS.

## Variables generadas por Render

- `NODE_ENV=production`
- `JWT_SECRET` generado automáticamente por Render
- `FRONTEND_ORIGIN` se obtiene de `RENDER_EXTERNAL_URL`

Así los enlaces de recuperación dejan de depender de `http://localhost:5173`.

## Publicación

1. Subir este proyecto a un repositorio GitHub.
2. En Render elegir **New → Blueprint** o **New → Web Service**.
3. Si se usa Blueprint, Render leerá `render.yaml`.
4. Elegir el plan Free.
5. Esperar el deploy.
6. Probar `/api/health`.
7. Probar login y recuperación de contraseña.

## Comandos locales habituales

```bash
npm install
npm run install:all
npm run dev
```

No usar `npm run db:init` salvo que se indique expresamente para una base nueva.
