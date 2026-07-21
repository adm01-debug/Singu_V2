#!/usr/bin/env bash
# Drena o slot lógico wal2json para arquivos rotacionados em CDC_OUT_DIR.
# Roda em foreground; use `nohup ./drain.sh &` para background.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${SRC_DB_URL:?defina SRC_DB_URL}"
: "${CDC_OUT_DIR:=$SCRIPT_DIR/out}"
: "${CDC_SLOT:=migration_slot}"

mkdir -p "$CDC_OUT_DIR"

echo "▶ Drenando slot=$CDC_SLOT para $CDC_OUT_DIR (Ctrl+C para parar)"
exec pg_recvlogical \
  --dbname "$SRC_DB_URL" \
  --slot "$CDC_SLOT" \
  --start \
  --option=format-version=2 \
  --option=include-lsn=true \
  --option=include-timestamp=true \
  --file "$CDC_OUT_DIR/wal-$(date -u +%Y%m%dT%H%M%SZ).json" \
  --fsync-interval=1000