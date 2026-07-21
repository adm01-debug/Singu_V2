#!/usr/bin/env bash
# CDC Lag Watchdog — monitora lag do slot lógico e alerta antes de encher disco.
# Uso: CDC_SLOT=migration_slot LAG_MAX_SEC=30 LAG_MAX_BYTES=1073741824 ./cdc/lag-watch.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${SRC_DB_URL:?SRC_DB_URL obrigatório}"
: "${CDC_SLOT:=migration_slot}"
: "${LAG_MAX_SEC:=30}"
: "${LAG_MAX_BYTES:=1073741824}"   # 1 GiB
: "${POLL_SEC:=10}"
: "${AUTO_DRAIN:=0}"               # 1 = executa cdc/drain.sh se lag crítico

log() { printf '[lag-watch %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

while true; do
  read -r lag_bytes lag_sec active <<<"$(psql "$SRC_DB_URL" -Atqc "
    SELECT
      COALESCE(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn), 0),
      COALESCE(EXTRACT(EPOCH FROM (now() - COALESCE(pg_stat_get_wal_receiver().last_msg_receipt_time, now()))), 0)::int,
      active::text
    FROM pg_replication_slots
    WHERE slot_name = '$CDC_SLOT';
  " | tr '|' ' ')"

  if [[ -z "${lag_bytes:-}" ]]; then
    log "SLOT '$CDC_SLOT' NÃO ENCONTRADO — abortando"
    exit 2
  fi

  log "slot=$CDC_SLOT active=$active lag_bytes=$lag_bytes lag_sec=$lag_sec"

  crit=0
  (( lag_bytes > LAG_MAX_BYTES )) && { log "🚨 lag_bytes > $LAG_MAX_BYTES"; crit=1; }
  (( lag_sec > LAG_MAX_SEC ))     && { log "🚨 lag_sec > $LAG_MAX_SEC";     crit=1; }

  if (( crit == 1 && AUTO_DRAIN == 1 )); then
    log "⚡ AUTO_DRAIN — disparando drain de emergência"
    nohup "$SCRIPT_DIR/drain.sh" >>"$SCRIPT_DIR/out/emergency-drain.log" 2>&1 &
  fi

  sleep "$POLL_SEC"
done