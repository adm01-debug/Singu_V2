#!/usr/bin/env bash
# ============================================================================
# post-cutover-watch.sh — vigília pós-cutover (somente leitura): fila de
# regeneração, heartbeat de saúde, Storage e Edge Function de health.
#
# Uso: WINDOW_HRS=24 INTERVAL_SEC=60 ./monitoring/post-cutover-watch.sh
#      ./monitoring/post-cutover-watch.sh --once     # uma rodada e sai
# Ambiente (scripts/migration/.env; ambiente vence):
#   DEST_DB_URL, DEST_SUPABASE_URL, DEST_ANON_KEY — obrigatórias
#   WINDOW_HRS (padrão 24) · INTERVAL_SEC (padrão 60) · LOG_DIR (padrão ./logs)
# A chave vai ao curl por arquivo de cabeçalhos 600 (não aparece em `ps`).
# O arquivo de log não leva cores. Ctrl+C encerra limpo.
# Exit: 0 janela sem ERROR · 1 houve ao menos uma rodada com ERROR · 2 uso/config.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"
MIG_TAG="watch"

ONCE=0
case "${1:-}" in
  --once)    ONCE=1 ;;
  -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
esac

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
mig_alias DEST_DB_URL TARGET_DB_URL
for v in DEST_DB_URL DEST_SUPABASE_URL DEST_ANON_KEY; do
  [[ -n "${!v:-}" ]] || mig_die 2 "$v obrigatório"
done
WINDOW_HRS="${WINDOW_HRS:-24}"
INTERVAL_SEC="${INTERVAL_SEC:-60}"
mig_is_uint "$WINDOW_HRS" || mig_die 2 "WINDOW_HRS inválido: $WINDOW_HRS"
if ! mig_is_uint "$INTERVAL_SEC" || (( INTERVAL_SEC < 1 )); then mig_die 2 "INTERVAL_SEC inválido: $INTERVAL_SEC"; fi
mig_need psql curl

umask 077
LOG_DIR="${LOG_DIR:-logs}"; mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/watch-$(date -u +%Y%m%dT%H%M%SZ)-$$.log"
HEADERS="$(mktemp)"
printf 'apikey: %s\nAuthorization: Bearer %s\n' "$DEST_ANON_KEY" "$DEST_ANON_KEY" > "$HEADERS"

errors=0
finish() {
  rm -f "$HEADERS"
  echo "Watch encerrado. Log: $LOG (rodadas com ERROR: $errors)"
  if (( errors > 0 )); then exit 1; fi
  exit 0
}
trap 'trap - EXIT; echo; finish' INT TERM
trap 'rm -f "$HEADERS"' EXIT

started=$(date +%s); end=$((started + WINDOW_HRS*3600))
paint() {  # paint <status> — cor só no terminal
  if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
    case "$1" in OK) printf '\033[32m%s\033[0m' "$1" ;; WARN) printf '\033[33m%s\033[0m' "$1" ;; *) printf '\033[31m%s\033[0m' "$1" ;; esac
  else printf '%s' "$1"; fi
}
http_code() {  # sempre imprime exatamente um código (000 = sem resposta)
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' -m 5 -H "@$HEADERS" "$1" 2>/dev/null)" || code="000"
  [[ "$code" =~ ^[0-9]{3}$ ]] || code="000"
  printf '%s' "$code"
}

check() {
  local ts queue_pending last_hb storage_code ef_code status line
  ts=$(date -u +%H:%M:%SZ)
  queue_pending=$(mig_psql "$DEST_DB_URL" -XAtqc \
    "SELECT count(*) FROM public.behavioral_profile_regen_queue WHERE processed_at IS NULL" 2>/dev/null || echo "ERR")
  last_hb=$(mig_psql "$DEST_DB_URL" -XAtqc \
    "SELECT COALESCE(EXTRACT(EPOCH FROM (now() - MAX(created_at)))::int, -1) FROM public.system_health_snapshots" 2>/dev/null || echo "ERR")
  storage_code=$(http_code "$DEST_SUPABASE_URL/storage/v1/bucket")
  ef_code=$(http_code "$DEST_SUPABASE_URL/functions/v1/health")

  status="OK"
  if [[ "$queue_pending" =~ ^[0-9]+$ ]] && (( queue_pending > 500 )); then status="WARN"; fi
  if [[ "$last_hb" =~ ^[0-9]+$ ]] && (( last_hb > 600 )); then status="WARN"; fi
  if [[ "$queue_pending" == "ERR" || "$last_hb" == "ERR" ]]; then status="ERROR"; fi
  if [[ "$storage_code" != "200" ]]; then status="ERROR"; fi
  if [[ "$ef_code" != "200" && "$ef_code" != "401" ]]; then status="ERROR"; fi
  if [[ "$status" == "ERROR" ]]; then errors=$((errors+1)); fi

  line="queue=$queue_pending hb_age=${last_hb}s storage=$storage_code ef=$ef_code"
  printf '[%s] %s %s\n' "$ts" "$status" "$line" >> "$LOG"
  printf '[%s] %s %s\n' "$ts" "$(paint "$status")" "$line"
}

echo "Watching por ${WINDOW_HRS}h a cada ${INTERVAL_SEC}s → $LOG"
while :; do
  check
  now=$(date +%s)
  if (( ONCE || now >= end )); then break; fi
  sleep "$INTERVAL_SEC" & wait $! || true
done
trap - EXIT
finish
