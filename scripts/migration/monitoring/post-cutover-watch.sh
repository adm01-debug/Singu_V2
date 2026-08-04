#!/usr/bin/env bash
# post-cutover-watch.sh — Loop de vigília pós-cutover.
# Uso: WINDOW_HRS=24 INTERVAL_SEC=60 ./monitoring/post-cutover-watch.sh
set -euo pipefail

: "${DEST_DB_URL:?DEST_DB_URL obrigatório}"
: "${DEST_SUPABASE_URL:?DEST_SUPABASE_URL obrigatório}"
: "${DEST_ANON_KEY:?DEST_ANON_KEY obrigatório}"

WINDOW_HRS="${WINDOW_HRS:-24}"
INTERVAL_SEC="${INTERVAL_SEC:-60}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_DIR="logs"; mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/watch-$TS.log"

started=$(date +%s); end=$((started + WINDOW_HRS*3600))
red(){ printf '\033[31m%s\033[0m' "$1"; }
green(){ printf '\033[32m%s\033[0m' "$1"; }
yel(){ printf '\033[33m%s\033[0m' "$1"; }

check() {
  local ts; ts=$(date -u +%H:%M:%SZ)
  local queue_pending last_hb storage_code ef_code status color
  queue_pending=$(psql "$DEST_DB_URL" -Atqc \
    "SELECT count(*) FROM behavioral_profile_regen_queue WHERE processed_at IS NULL;" 2>/dev/null || echo "ERR")
  last_hb=$(psql "$DEST_DB_URL" -Atqc \
    "SELECT COALESCE(EXTRACT(EPOCH FROM (now() - MAX(created_at)))::int, -1)
     FROM system_health_snapshots;" 2>/dev/null || echo "ERR")
  storage_code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 \
    -H "apikey: $DEST_ANON_KEY" "$DEST_SUPABASE_URL/storage/v1/bucket" || echo "000")
  ef_code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 \
    -H "apikey: $DEST_ANON_KEY" -H "Authorization: Bearer $DEST_ANON_KEY" \
    "$DEST_SUPABASE_URL/functions/v1/health" || echo "000")

  status="OK"
  [[ "$queue_pending" =~ ^[0-9]+$ ]] && (( queue_pending > 500 )) && status="WARN"
  [[ "$last_hb"       =~ ^[0-9]+$ ]] && (( last_hb > 600 ))       && status="WARN"
  [[ "$storage_code" != "200" ]] && status="ERROR"
  [[ "$ef_code" != "200" && "$ef_code" != "401" ]] && status="ERROR"

  case "$status" in
    OK)    color="$(green OK)" ;;
    WARN)  color="$(yel WARN)" ;;
    ERROR) color="$(red ERROR)" ;;
  esac
  printf '[%s] %s queue=%s hb_age=%ss storage=%s ef=%s\n' \
    "$ts" "$color" "$queue_pending" "$last_hb" "$storage_code" "$ef_code" | tee -a "$LOG"
}

echo "Watching por ${WINDOW_HRS}h a cada ${INTERVAL_SEC}s → $LOG"
while :; do
  check
  now=$(date +%s); (( now >= end )) && break
  sleep "$INTERVAL_SEC"
done
echo "Watch encerrado. Log: $LOG"