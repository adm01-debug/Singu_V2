#!/usr/bin/env bash
# Wrapper de tz/locale parity — falha em qualquer divergência.
# Uso: SRC_DB_URL=... DEST_DB_URL=... ./verify/tz-locale-parity.sh
# Códigos de saída: 0 = idênticos; 1 = divergem; 2 = erro de uso ou consulta falhou.
# Somente leitura.
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/tz-locale-parity.sql"
[[ -n "${SRC_DB_URL:-}" ]]  || { echo "✖ SRC_DB_URL obrigatório" >&2; exit 2; }
[[ -n "${DEST_DB_URL:-}" ]] || { echo "✖ DEST_DB_URL obrigatório" >&2; exit 2; }
[[ -r "$SQL_FILE" ]] || { echo "✖ não achei $SQL_FILE" >&2; exit 2; }
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"

SQL="$(cat "$SQL_FILE")"
SRC=$(psql "$SRC_DB_URL"  -X -Atq -v ON_ERROR_STOP=1 -c "$SQL") || { echo "✖ consulta na ORIGEM falhou" >&2; exit 2; }
DST=$(psql "$DEST_DB_URL" -X -Atq -v ON_ERROR_STOP=1 -c "$SQL") || { echo "✖ consulta no DESTINO falhou" >&2; exit 2; }
[[ -n "$SRC" && -n "$DST" ]] || { echo "✖ resposta vazia de um dos lados" >&2; exit 2; }
diff <(echo "$SRC") <(echo "$DST") || {
  echo "🚨 tz/locale divergem — ORDER BY e comparações de texto podem se comportar diferente"
  exit 1
}
echo "✔ Timezone e locale idênticos"
