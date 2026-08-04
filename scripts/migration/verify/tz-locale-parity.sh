#!/usr/bin/env bash
# Wrapper de tz/locale parity — falha em qualquer divergência.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/tz-locale-parity.sql"
: "${SRC_DB_URL:?SRC_DB_URL obrigatório}"
: "${DEST_DB_URL:?DEST_DB_URL obrigatório}"

SRC=$(psql "$SRC_DB_URL"  -Atqc "$(cat "$SQL_FILE")")
DST=$(psql "$DEST_DB_URL" -Atqc "$(cat "$SQL_FILE")")
diff <(echo "$SRC") <(echo "$DST") || {
  echo "🚨 tz/locale divergem — ORDER BY e comparações de texto podem se comportar diferente"
  exit 1
}
echo "✔ Timezone e locale idênticos"