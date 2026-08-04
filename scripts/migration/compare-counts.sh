#!/usr/bin/env bash
# ============================================================================
# compare-counts.sh — compara contagens de linhas ORIGEM × DESTINO.
# Exit 1 se houver divergência em tabela fora da skip-list.
# ============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SKIP_FILE="$HERE/skip-tables.txt"
: "${SOURCE_DB_URL:?}"
: "${TARGET_DB_URL:?}"

QUERY="SELECT c.relname, COALESCE(s.n_live_tup, 0)
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
       WHERE n.nspname = 'public'
         AND c.relkind IN ('r','p')
         AND NOT c.relispartition
       ORDER BY c.relname"

SRC="$(mktemp)"; DST="$(mktemp)"; DRIFT="$(mktemp)"
trap 'rm -f "$SRC" "$DST" "$DRIFT"' EXIT

psql "$SOURCE_DB_URL" -Atq -F$'\t' -c "$QUERY" > "$SRC"
psql "$TARGET_DB_URL" -Atq -F$'\t' -c "$QUERY" > "$DST"

skip_match() {
  local t="$1"
  while IFS= read -r pat; do
    [[ -z "$pat" || "$pat" =~ ^# ]] && continue
    # shellcheck disable=SC2053
    [[ "$t" == $pat ]] && return 0
  done < "$SKIP_FILE"
  return 1
}

RED='\033[0;31m'; GRN='\033[0;32m'; YEL='\033[0;33m'; NC='\033[0m'
printf "%-45s %12s %12s %12s\n" "TABLE" "SOURCE" "TARGET" "DIFF"
printf -- '-%.0s' {1..85}; echo

join -t $'\t' -a1 -a2 -e '0' -o '0,1.2,2.2' "$SRC" "$DST" \
 | while IFS=$'\t' read -r table src dst; do
     diff=$(( dst - src ))
     if [[ $diff -eq 0 ]]; then
       color=$GRN
     elif skip_match "$table"; then
       color=$YEL
     else
       color=$RED
       echo 1 >> "$DRIFT"
     fi
     printf "${color}%-45s %12s %12s %+12d${NC}\n" "$table" "$src" "$dst" "$diff"
   done

if [[ -s "$DRIFT" ]]; then
  echo ""
  echo -e "${RED}✗ divergência detectada em tabela fora da skip-list${NC}"
  exit 1
fi
echo ""
echo -e "${GRN}✅ contagens compatíveis${NC}"