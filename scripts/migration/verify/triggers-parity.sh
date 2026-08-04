#!/usr/bin/env bash
# Wrapper: diff canônico de triggers + hash de functions entre origem e destino.
# Uso: SRC_DB_URL=... DEST_DB_URL=... ./verify/triggers-parity.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

SQL="$SCRIPT_DIR/triggers-parity.sql"
: "${SRC_DB_URL:?SRC_DB_URL obrigatório}"
: "${DEST_DB_URL:?DEST_DB_URL obrigatório}"

OUT="$SCRIPT_DIR/out"
mkdir -p "$OUT"
SRC="$OUT/triggers-src.txt"
DST="$OUT/triggers-dest.txt"

log() { printf '[triggers-parity %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

log "extraindo canônico da origem..."
psql "$SRC_DB_URL"  -Atqf "$SQL" > "$SRC"
log "extraindo canônico do destino..."
psql "$DEST_DB_URL" -Atqf "$SQL" > "$DST"

if diff -u "$SRC" "$DST" > "$OUT/triggers.diff"; then
  log "✔ Triggers e functions com paridade total"
  exit 0
fi

log "🚨 Divergência detectada — ver $OUT/triggers.diff"
head -n 60 "$OUT/triggers.diff"
exit 1