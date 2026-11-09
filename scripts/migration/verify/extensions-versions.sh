#!/usr/bin/env bash
# Wrapper que compara extensões críticas entre origem e destino.
# Uso: SRC_DB_URL=... DEST_DB_URL=... ./verify/extensions-versions.sh
# Códigos de saída: 0 = paridade; 1 = versões divergem; 2 = erro de uso, dependência
# ausente (jq/psql) ou consulta falhou. Somente leitura.
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/extensions-versions.sql"
[[ -n "${SRC_DB_URL:-}" ]]  || { echo "✖ SRC_DB_URL obrigatório" >&2; exit 2; }
[[ -n "${DEST_DB_URL:-}" ]] || { echo "✖ DEST_DB_URL obrigatório" >&2; exit 2; }
command -v jq >/dev/null || { echo "✖ jq requerido" >&2; exit 2; }
[[ -r "$SQL_FILE" ]] || { echo "✖ não achei $SQL_FILE" >&2; exit 2; }
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"

SQL="$(cat "$SQL_FILE")"
SRC_JSON=$(psql "$SRC_DB_URL"  -X -Atq -v ON_ERROR_STOP=1 -c "$SQL") || { echo "✖ consulta na ORIGEM falhou" >&2; exit 2; }
DST_JSON=$(psql "$DEST_DB_URL" -X -Atq -v ON_ERROR_STOP=1 -c "$SQL") || { echo "✖ consulta no DESTINO falhou" >&2; exit 2; }
# Nenhuma extensão crítica instalada → agregado NULL (linha vazia): trata como objeto vazio.
SRC_JSON="${SRC_JSON:-{\}}"
DST_JSON="${DST_JSON:-{\}}"
SRC_CANON=$(jq -S . <<<"$SRC_JSON") || { echo "✖ resposta da ORIGEM não é JSON" >&2; exit 2; }
DST_CANON=$(jq -S . <<<"$DST_JSON") || { echo "✖ resposta do DESTINO não é JSON" >&2; exit 2; }

diff <(echo "$SRC_CANON") <(echo "$DST_CANON") || {
  echo "🚨 Divergência de versão de extensão crítica — não fazer cutover"
  exit 1
}
echo "✔ Extensões críticas com paridade de versão"
