#!/usr/bin/env bash
# check-runbook-coverage.sh — Rodada 26/10
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RULES_DIR="$ROOT/monitoring/prometheus/rules"
RUNBOOK="$ROOT/docs/runbooks/db-guards.md"

[[ -d "$RULES_DIR" ]] || { echo "rules dir ausente"; exit 2; }
[[ -f "$RUNBOOK" ]]   || { echo "runbook ausente"; exit 2; }

mapfile -t ANCHORS < <(grep -E '^## [a-z0-9-]+' "$RUNBOOK" | sed 's/^## //')
has_anchor(){ local n="$1"; for a in "${ANCHORS[@]}"; do [[ "$a" == "$n" ]] && return 0; done; return 1; }

FAILED=0
while IFS= read -r url; do
  anchor="${url##*#}"
  [[ "$anchor" == *"{{"* ]] && continue
  if ! has_anchor "$anchor"; then
    echo "MISSING ancora '## $anchor' em runbook"
    FAILED=$((FAILED+1))
  fi
done < <(grep -Eho 'runbook_url:[[:space:]]*"[^"]+"' "$RULES_DIR"/*.yml | sed -E 's/.*"([^"]+)"/\1/')

AUDIT="$ROOT/scripts/migration/verify/full-audit.sh"
if [[ -f "$AUDIT" ]]; then
  in_fatal=0
  while IFS= read -r line; do
    if [[ "$line" == "FATAL=("* ]]; then in_fatal=1; continue; fi
    if [[ $in_fatal -eq 1 && "$line" == ")"* ]]; then in_fatal=0; continue; fi
    if [[ $in_fatal -eq 1 ]]; then
      name=$(echo "$line" | tr -d ' \t' | sed 's/\.sql$//')
      [[ -z "$name" ]] && continue
      if ! has_anchor "$name"; then
        echo "MISSING secao runbook para guard FATAL: $name"
        FAILED=$((FAILED+1))
      fi
    fi
  done <"$AUDIT"
fi

if [[ "$FAILED" -gt 0 ]]; then echo "FAIL: $FAILED"; exit 1; fi
echo "OK: cobertura completa"