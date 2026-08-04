#!/usr/bin/env bash
# Wrapper: diff canônico de GRANTs em public.* entre origem e destino.
# Uso: SRC_DB_URL=... DEST_DB_URL=... ./verify/grants-parity.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

SQL="$SCRIPT_DIR/grants-parity.sql"
: "${SRC_DB_URL:?SRC_DB_URL obrigatório}"
: "${DEST_DB_URL:?DEST_DB_URL obrigatório}"

OUT="$SCRIPT_DIR/out"
mkdir -p "$OUT"
SRC="$OUT/grants-src.txt"
DST="$OUT/grants-dest.txt"

log() { printf '[grants-parity %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

log "extraindo grants da origem..."
psql "$SRC_DB_URL"  -Atqf "$SQL" > "$SRC"
log "extraindo grants do destino..."
psql "$DEST_DB_URL" -Atqf "$SQL" > "$DST"

if diff -u "$SRC" "$DST" > "$OUT/grants.diff"; then
  log "OK GRANTs com paridade total em public.*"
  exit 0
fi

log "DIVERGENCIA de GRANTs detectada - ver $OUT/grants.diff"
head -n 80 "$OUT/grants.diff"
exit 1