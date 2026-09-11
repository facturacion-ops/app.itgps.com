# Corrección de instalación — UI Transversal V2

El ZIP anterior tenía una dependencia instalada solo en el nivel raíz, pero `concurrently` ejecuta
los proyectos `server` y `frontend` desde sus propios directorios.

Se corrigieron los package.json para que:
- `server` declare `dotenv`.
- `frontend` declare `vite`.
- Se agregó `npm run install:all` para instalar dependencias de los tres niveles.

## Instalación recomendada

Desde `IT-GPS-APP-Fase-2`:

```powershell
npm install
npm --prefix server install
npm --prefix frontend install
npm run dev
```

O, en una sola línea:

```powershell
npm run install:all
npm run dev
```

No ejecutar `db:init`; esta corrección no modifica SQLite.
