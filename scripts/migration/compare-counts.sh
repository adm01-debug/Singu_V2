#!/usr/bin/env bash
# ============================================================================
# compare-counts.sh — compara contagens de linhas ORIGEM × DESTINO (public).
# Somente leitura nos dois lados.
#
# Uso:
#   bash scripts/migration/compare-counts.sh             # contagem EXATA (count(*))
#   bash scripts/migration/compare-counts.sh --estimate  # rápida, via estatística
#                                                        # (n_live_tup; pode errar)
#
# Ambiente (scripts/migration/.env ou env.migration; ambiente vence):
#   SRC_DB_URL (ou SOURCE_DB_URL) e DEST_DB_URL (ou TARGET_DB_URL) — obrigatórias
#   NO_COLOR=1  desliga cores (também desligadas quando a saída não é terminal)
#
# Tabela da skip-tables.txt com diferença aparece como aviso e não reprova.
# Exit: 0 contagens compatíveis · 1 divergência fora da skip-list (ou tabela
#       ausente de um lado) · 2 uso/config/conexão.
# ============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR source=_lib.sh
source "$HERE/_lib.sh"
MIG_TAG="compare"

MODE="exact"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --estimate) MODE="estimate"; shift ;;
    --exact)    MODE="exact"; shift ;;
    -h|--help)  mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
  esac
done

mig_load_env "$HERE/.env" "$HERE/env.migration"
mig_alias SRC_DB_URL SOURCE_DB_URL
mig_alias DEST_DB_URL TARGET_DB_URL
[[ -n "${SRC_DB_URL:-}" ]]  || mig_die 2 "defina SRC_DB_URL (ou SOURCE_DB_URL)"
[[ -n "${DEST_DB_URL:-}" ]] || mig_die 2 "defina DEST_DB_URL (ou TARGET_DB_URL)"
SKIP_FILE="$HERE/skip-tables.txt"
[[ -f "$SKIP_FILE" ]] || mig_die 2 "skip-tables.txt não encontrado em $HERE"
mig_need psql awk

if [[ "$MODE" == "exact" ]]; then
  # count(*) real por tabela numa única consulta (query_to_xml executa o SELECT).
  QUERY="SELECT c.relname,
           (xpath('/row/n/text()', query_to_xml(format('SELECT count(*) AS n FROM %I.%I', n.nspname, c.relname), false, true, '')))[1]::text
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND NOT c.relispartition"
else
  QUERY="SELECT c.relname, COALESCE(s.n_live_tup, 0)
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
         LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
         WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND NOT c.relispartition"
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
trap 'exit 130' INT TERM

mig_psql "$SRC_DB_URL"  -XAtq -F $'\t' -v ON_ERROR_STOP=1 -c "$QUERY" > "$WORK/src" \
  || mig_die 2 "falha ao consultar a ORIGEM ($(mig_target "$SRC_DB_URL"))"
mig_psql "$DEST_DB_URL" -XAtq -F $'\t' -v ON_ERROR_STOP=1 -c "$QUERY" > "$WORK/dst" \
  || mig_die 2 "falha ao consultar o DESTINO ($(mig_target "$DEST_DB_URL"))"

skip_match() {
  local t="$1" pat
  while IFS= read -r pat || [[ -n "$pat" ]]; do
    pat="${pat%$'\r'}"
    [[ -z "$pat" || "$pat" =~ ^[[:space:]]*# ]] && continue
    # shellcheck disable=SC2053  # curinga intencional (glob da skip-list)
    [[ "$t" == $pat ]] && return 0
  done < "$SKIP_FILE"
  return 1
}

RED=''; GRN=''; YEL=''; NC=''
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then RED=$'\033[0;31m'; GRN=$'\033[0;32m'; YEL=$'\033[0;33m'; NC=$'\033[0m'; fi

[[ "$MODE" == "estimate" ]] && mig_log "modo --estimate: números vêm de estatística e podem divergir do real"
printf "%-45s %12s %12s %12s\n" "TABLE" "SOURCE" "TARGET" "DIFF"
printf -- '-%.0s' {1..85}; echo

drift=0
# Junta os dois lados sem depender de ordenação/locale ("-" = tabela ausente).
while IFS=$'\t' read -r table src dst; do
  note=""
  if [[ "$src" == "-" || "$dst" == "-" ]]; then
    diff="n/a"; note="  (ausente em $([[ "$src" == "-" ]] && echo origem || echo destino))"
  else
    diff=$(( dst - src ))
  fi
  if [[ "$diff" == "0" ]]; then
    color=$GRN
  elif skip_match "$table"; then
    color=$YEL; note+="  [skip-list]"
  else
    color=$RED; drift=$((drift+1))
  fi
  [[ "$diff" == "n/a" ]] || diff="$(printf '%+d' "$diff")"
  printf "%s%-45s %12s %12s %12s%s%s\n" "$color" "$table" "$src" "$dst" "$diff" "$note" "$NC"
done < <(awk -F '\t' '
  FNR == NR { s[$1] = $2; all[$1]; next }
  { d[$1] = $2; all[$1] }
  END { for (t in all) printf "%s\t%s\t%s\n", t, (t in s ? s[t] : "-"), (t in d ? d[t] : "-") }
' "$WORK/src" "$WORK/dst" | LC_ALL=C sort)

echo ""
if (( drift > 0 )); then
  echo "${RED}✗ divergência em $drift tabela(s) fora da skip-list${NC}"
  exit 1
fi
echo "${GRN}✅ contagens compatíveis${NC}"
