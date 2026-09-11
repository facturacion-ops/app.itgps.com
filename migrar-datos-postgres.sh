#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Primero configure DATABASE_URL con la External Database URL de Render}"
node server/scripts/migrate-sqlite-to-postgres.cjs
