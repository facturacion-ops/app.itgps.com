# FASE 18.2 V3 — Identidad documental definitiva

## Objetivo
Separar de forma estricta la identidad legal de la empresa de la identidad de marca blanca usada en documentos.

## Reglas
- Empresa / razón social legal: siempre proviene de `empresas.nombre`.
- NIT: siempre proviene de `empresas.nit`.
- Marca blanca: proviene de `empresa_marca.nombre_comercial` y, como fallback, `nombre_aplicacion`.
- Logo, colores y textos documentales provienen de `empresa_marca` de la misma `empresa_id`.
- Nunca se copia el nombre de la marca blanca sobre la razón social legal.
- Nunca se usa una identidad de otra empresa.

## Cabecera documental
La cabecera muestra la identidad de marca blanca. La identificación legal se presenta por separado como:
- Marca blanca
- Empresa / razón social legal
- NIT

## Multiempresa
Todas las consultas documentales se resuelven por `empresa_id`, manteniendo aislamiento entre empresas.

## Base de datos
No se incluye ni se recrea la base de datos.
