#!/usr/bin/env bash
# WAL Archive Health — alerta se archiving parou ou está falhando (encolhe PITR window).
# Uso: SRC_DB_URL=... ARCHIVE_MAX_LAG_SEC=300 ./dr/wal-archive-check.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${SRC_DB_URL:?SRC_DB_URL obrigatório}"
: "${ARCHIVE_MAX_LAG_SEC:=300}"           # 5 min
: "${FAILED_DELTA_MAX:=0}"                # 0 = qualquer falha nova é crítica

STATE_FILE="/tmp/wal-archive-check.state"
log() { printf '[wal-archive %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

read -r archived failed last_archived_epoch last_failed_epoch <<<"$(
  psql "$SRC_DB_URL" -Atqc "
    SELECT
      archived_count,
      failed_count,
      COALESCE(EXTRACT(EPOCH FROM last_archived_time)::bigint, 0),
      COALESCE(EXTRACT(EPOCH FROM last_failed_time)::bigint, 0)
    FROM pg_stat_archiver;
  " | tr '|' ' '
)"

now=$(date +%s)
lag=$(( now - last_archived_epoch ))
log "archived=$archived failed=$failed last_archived_lag=${lag}s"

status=0
if (( last_archived_epoch == 0 )); then
  log "🚨 last_archived_time é NULL — archiving nunca rodou ou está desabilitado"; status=1
elif (( lag > ARCHIVE_MAX_LAG_SEC )); then
  log "🚨 archive lag=${lag}s > ${ARCHIVE_MAX_LAG_SEC}s"; status=1
else
  log "✔ archive lag OK"
fi

if [[ -f "$STATE_FILE" ]]; then
  prev_failed=$(cat "$STATE_FILE")
  delta=$(( failed - prev_failed ))
  if (( delta > FAILED_DELTA_MAX )); then
    log "🚨 failed_count aumentou em ${delta} desde última execução"; status=1
  else
    log "✔ failed_count estável (Δ=${delta})"
  fi
else
  log "ℹ primeira execução — snapshot inicial"
fi
echo "$failed" > "$STATE_FILE"

exit "$status"