@echo off
if "%DATABASE_URL%"=="" (
  echo ERROR: primero configure DATABASE_URL con la External Database URL de Render.
  exit /b 1
)
node server\scripts\migrate-sqlite-to-postgres.cjs
