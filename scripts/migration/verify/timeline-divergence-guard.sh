#!/usr/bin/env bash
# timeline-divergence-guard.sh — Rodada 20/10
set -euo pipefail

: "${SRC_DB_URL:?SRC_DB_URL obrigatorio}"
: "${DEST_DB_URL:?DEST_DB_URL obrigatorio}"

echo "== timeline-divergence-guard =="

SRC_TL=$(psql "$SRC_DB_URL"  -Atc "SELECT timeline_id FROM pg_control_checkpoint();")
DST_TL=$(psql "$DEST_DB_URL" -Atc "SELECT timeline_id FROM pg_control_checkpoint();")

printf 'SRC timeline_id : %s\nDEST timeline_id: %s\n' "$SRC_TL" "$DST_TL"

if [[ "$SRC_TL" != "$DST_TL" ]]; then
  echo "FATAL: timelines divergentes (split-brain)."
  exit 1
fi
echo "OK timelines alinhadas."