#!/usr/bin/env bash
# ============================================================================
# verify-extensions.sh — compara as extensões declaradas em 00_extensions.sql
# com pg_extension no DESTINO. Somente leitura.
#
# Uso: ./ddl/verify-extensions.sh
# Ambiente (scripts/migration/.env; ambiente vence):
#   DEST_DB_URL (ou TARGET_DB_URL) — obrigatória
#   EXTENSIONS_SQL  arquivo de declarações (padrão ddl/00_extensions.sql)
# Exit: 0 todas instaladas · 1 falta alguma · 2 uso/config ou destino inacessível.
# ============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$SCRIPT_DIR/../_lib.sh"
MIG_TAG="verify-extensions"

case "${1:-}" in
  -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
esac

mig_load_env "$SCRIPT_DIR/../.env" "$SCRIPT_DIR/../env.migration"
mig_alias DEST_DB_URL TARGET_DB_URL
[[ -n "${DEST_DB_URL:-}" ]] || mig_die 2 "defina DEST_DB_URL"
SQL_FILE="${EXTENSIONS_SQL:-$SCRIPT_DIR/00_extensions.sql}"
[[ -f "$SQL_FILE" ]] || mig_die 2 "não encontrei $SQL_FILE"
mig_need psql

# Nome entre aspas pode ter hífen ("uuid-ossp"); sem aspas, só [a-z0-9_].
EXPECTED=$(grep -oiE 'CREATE[[:space:]]+EXTENSION[[:space:]]+(IF[[:space:]]+NOT[[:space:]]+EXISTS[[:space:]]+)?("[^"]+"|[a-z0-9_]+)' "$SQL_FILE" \
  | awk '{print tolower($NF)}' | tr -d '"' | LC_ALL=C sort -u || true)
[[ -n "$EXPECTED" ]] || mig_die 2 "nenhum CREATE EXTENSION em $SQL_FILE"

INSTALLED=$(mig_psql "$DEST_DB_URL" -XtAq -v ON_ERROR_STOP=1 -c "SELECT extname FROM pg_extension" | LC_ALL=C sort) \
  || mig_die 2 "destino inacessível ($(mig_target "$DEST_DB_URL"))"

echo "▶ Esperadas:";  printf '%s\n' "$EXPECTED"  | while IFS= read -r l; do echo "  $l"; done
echo "▶ Instaladas:"; printf '%s\n' "$INSTALLED" | while IFS= read -r l; do echo "  $l"; done

MISSING=$(LC_ALL=C comm -23 <(printf '%s\n' "$EXPECTED") <(printf '%s\n' "$INSTALLED"))
if [[ -n "$MISSING" ]]; then
  echo "✖ Extensões esperadas ausentes no destino:"
  printf '%s\n' "$MISSING" | while IFS= read -r l; do echo "  - $l"; done
  exit 1
fi
echo "✔ Todas as extensões declaradas estão instaladas."
