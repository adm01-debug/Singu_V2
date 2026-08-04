#!/usr/bin/env bash
# Compara extensões declaradas em 00_extensions.sql com pg_extension no destino.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
: "${DEST_DB_URL:?defina DEST_DB_URL}"

EXPECTED=$(grep -oiE 'CREATE EXTENSION[[:space:]]+(IF NOT EXISTS[[:space:]]+)?"?[a-z_]+' "$SCRIPT_DIR/00_extensions.sql" \
  | awk '{print tolower($NF)}' | tr -d '"' | sort -u)

INSTALLED=$(psql "$DEST_DB_URL" -tA -c "SELECT extname FROM pg_extension ORDER BY 1")

echo "▶ Esperadas:"; echo "$EXPECTED" | sed 's/^/  /'
echo "▶ Instaladas:"; echo "$INSTALLED" | sed 's/^/  /'

MISSING=$(comm -23 <(echo "$EXPECTED") <(echo "$INSTALLED"))
if [[ -n "$MISSING" ]]; then
  echo "✖ Extensões esperadas ausentes no destino:"
  echo "$MISSING" | sed 's/^/  - /'
  exit 1
fi
echo "✔ Todas as extensões declaradas estão instaladas."
