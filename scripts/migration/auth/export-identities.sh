#!/usr/bin/env bash
# ============================================================================
# export-identities.sh — exporta auth.identities (provedores OAuth ligados aos
# usuários) da ORIGEM para CSV. Somente leitura.
#
# Uso: SRC_DB_URL=... ./auth/export-identities.sh
# Ambiente (scripts/migration/.env; ambiente vence):
#   SRC_DB_URL (ou SOURCE_DB_URL)  origem — obrigatória
#   OUT                            arquivo de saída (padrão ./auth-identities.csv)
#
# O CSV contém dado pessoal: é gravado com permissão 600 e só substitui o
# arquivo anterior se a exportação inteira der certo.
# Exit: 0 ok · 1 falha na exportação · 2 uso/config.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"
MIG_TAG="identities-export"

case "${1:-}" in
  -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
esac

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
mig_alias SRC_DB_URL SOURCE_DB_URL
[[ -n "${SRC_DB_URL:-}" ]] || mig_die 2 "defina SRC_DB_URL"
OUT="${OUT:-./auth-identities.csv}"
mig_need psql awk

umask 077
TMP="$(mktemp "${OUT}.XXXXXX")" || mig_die 2 "não consigo escrever em $(dirname "$OUT")"
trap 'rm -f "$TMP"' EXIT
trap 'exit 130' INT TERM

mig_psql "$SRC_DB_URL" -Xq -v ON_ERROR_STOP=1 -c "\\copy (
  SELECT id, user_id, provider, identity_data, last_sign_in_at, created_at, updated_at, email, provider_id
  FROM auth.identities ORDER BY created_at, id
) TO STDOUT WITH (FORMAT csv, HEADER true)" > "$TMP" \
  || mig_die 1 "exportação falhou — $OUT não foi alterado"

# registros CSV reais (JSON com quebra de linha não conta em dobro)
rows=$(awk '{ q += gsub(/"/, "&") } q % 2 == 0 { n++; q = 0 } END { print (n > 0 ? n - 1 : 0) }' "$TMP")
mv "$TMP" "$OUT"
mig_log "✔ exportadas $rows identities → $OUT"
