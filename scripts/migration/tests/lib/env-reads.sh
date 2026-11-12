#!/usr/bin/env bash
# env-reads.sh <arquivo>... — lista (uma por linha, ordenada) as variáveis de
# AMBIENTE lidas por scripts bash/mjs/ts do kit. Heurística por padrões:
#   bash: ${VAR:-…} ${VAR:=…} ${VAR:?…} ${VAR-…} ${VAR+…}, mig_alias A B,
#         e listas "for v in A B C; do" usadas com ${!v}
#   mjs/ts: process.env.VAR, process.env['VAR'], Deno.env.get("VAR")
set -euo pipefail
for f in "$@"; do
  case "$f" in
    *.sh)
      grep -oE '\$\{[A-Z][A-Z0-9_]*(:?[-=?+])' "$f" | grep -oE '[A-Z][A-Z0-9_]*' || true
      grep -oE 'mig_alias [A-Z][A-Z0-9_]* [A-Z][A-Z0-9_]*' "$f" | tr ' ' '\n' | grep -E '^[A-Z]' || true
      # shellcheck disable=SC2016  # padrão literal "${!v"
      if grep -q '\${!v' "$f"; then
        grep -oE 'for v in [A-Z][A-Z0-9_ ]*;' "$f" | sed 's/^for v in //; s/;$//' | tr ' ' '\n' | grep -E '^[A-Z]' || true
      fi ;;
    *.mjs|*.ts|*.js)
      grep -oE "process\.env\.[A-Z][A-Z0-9_]*|process\.env\[['\"][A-Z][A-Z0-9_]*|Deno\.env\.get\([[:space:]]*['\"][A-Z][A-Z0-9_]*" "$f" \
        | grep -oE '[A-Z][A-Z0-9_]*$' || true ;;
  esac
done | LC_ALL=C sort -u
