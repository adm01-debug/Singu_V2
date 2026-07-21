#!/usr/bin/env bash
# Wrapper que compara extensões críticas entre origem e destino.
# Uso: SRC_DB_URL=... DEST_DB_URL=... ./verify/extensions-versions.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/extensions-versions.sql"
: "${SRC_DB_URL:?SRC_DB_URL obrigatório}"
: "${DEST_DB_URL:?DEST_DB_URL obrigatório}"
command -v jq >/dev/null || { echo "✖ jq requerido"; exit 2; }

SRC_JSON=$(psql "$SRC_DB_URL"  -Atqc "$(cat "$SQL_FILE")")
DST_JSON=$(psql "$DEST_DB_URL" -Atqc "$(cat "$SQL_FILE")")

diff <(echo "$SRC_JSON" | jq -S .) <(echo "$DST_JSON" | jq -S .) || {
  echo "🚨 Divergência de versão de extensão crítica — não fazer cutover"
  exit 1
}
echo "✔ Extensões críticas com paridade de versão"