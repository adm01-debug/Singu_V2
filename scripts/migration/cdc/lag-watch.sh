#!/usr/bin/env bash
# ============================================================================
# lag-watch.sh — vigia o lag do slot lógico de CDC e alerta antes de o WAL
# retido encher o disco da origem. Somente leitura.
#
# Uso:
#   CDC_SLOT=migration_slot LAG_MAX_SEC=30 LAG_MAX_BYTES=1073741824 ./cdc/lag-watch.sh
#   ./cdc/lag-watch.sh --once     # uma medição e sai (cron/CI)
# Ambiente (scripts/migration/.env; ambiente vence):
#   SRC_DB_URL (ou SOURCE_DB_URL)  origem — obrigatória
#   CDC_SLOT        slot vigiado (padrão migration_slot)
#   LAG_MAX_BYTES   WAL retido máximo em bytes (padrão 1073741824 = 1 GiB)
#   LAG_MAX_SEC     segundos máximos SEM o slot avançar havendo WAL pendente (padrão 30)
#   POLL_SEC        intervalo entre medições (padrão 10)
#   AUTO_DRAIN      1 = se crítico e o slot estiver SEM consumidor, sobe cdc/drain.sh
#   LAG_MAX_FAILS   falhas de conexão seguidas toleradas antes de desistir (padrão 5)
#
# lag_sec é medido pelo próprio watcher: tempo desde a última vez em que
# confirmed_flush_lsn avançou (0 quando não há WAL pendente).
# Exit: 0 encerrado pelo operador (Ctrl+C) ou --once sem alerta · 1 --once com
#       lag crítico · 2 uso/config, slot inexistente ou origem inacessível.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"
MIG_TAG="lag-watch"

ONCE=0
case "${1:-}" in
  --once)    ONCE=1 ;;
  -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
esac

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
mig_alias SRC_DB_URL SOURCE_DB_URL
[[ -n "${SRC_DB_URL:-}" ]] || mig_die 2 "SRC_DB_URL obrigatório"
CDC_SLOT="${CDC_SLOT:-migration_slot}"
LAG_MAX_SEC="${LAG_MAX_SEC:-30}"
LAG_MAX_BYTES="${LAG_MAX_BYTES:-1073741824}"
POLL_SEC="${POLL_SEC:-10}"
AUTO_DRAIN="${AUTO_DRAIN:-0}"
LAG_MAX_FAILS="${LAG_MAX_FAILS:-5}"
for v in LAG_MAX_SEC LAG_MAX_BYTES POLL_SEC LAG_MAX_FAILS; do
  mig_is_uint "${!v}" || mig_die 2 "$v inválido: ${!v}"
done
(( POLL_SEC >= 1 )) || mig_die 2 "POLL_SEC precisa ser >= 1"
[[ "$CDC_SLOT" =~ ^[a-z0-9_]{1,63}$ ]] || mig_die 2 "CDC_SLOT inválido: use só a-z, 0-9 e _"
mig_need psql

trap 'echo; mig_log "encerrado pelo operador"; exit 0' INT TERM

last_lsn=""; last_advance=$(date +%s); fails=0; last_spawn=0
while true; do
  if ! row="$(mig_psql "$SRC_DB_URL" -XAtq -F ' ' -v ON_ERROR_STOP=1 -v slot="$CDC_SLOT" 2>/dev/null <<'SQL'
SELECT COALESCE(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn), 0)::bigint,
       COALESCE(confirmed_flush_lsn::text, '-'), active::text
FROM pg_replication_slots WHERE slot_name = :'slot';
SQL
)"; then
    fails=$((fails+1))
    mig_err "⚠ origem inacessível ($fails/$LAG_MAX_FAILS)"
    if (( ONCE || fails >= LAG_MAX_FAILS )); then mig_die 2 "origem inacessível — o lag NÃO está sendo vigiado"; fi
    sleep "$POLL_SEC" & wait $! || true
    continue
  fi
  fails=0
  [[ -n "$row" ]] || mig_die 2 "SLOT '$CDC_SLOT' NÃO ENCONTRADO — abortando"
  read -r lag_bytes lsn active <<<"$row"

  now=$(date +%s)
  if [[ "$lsn" != "$last_lsn" || "$lag_bytes" == "0" ]]; then last_lsn="$lsn"; last_advance=$now; fi
  lag_sec=$(( now - last_advance ))
  mig_log "slot=$CDC_SLOT active=$active lag_bytes=$lag_bytes lag_sec=$lag_sec"

  crit=0
  if (( lag_bytes > LAG_MAX_BYTES )); then mig_log "🚨 lag_bytes > $LAG_MAX_BYTES"; crit=1; fi
  if (( lag_sec > LAG_MAX_SEC ));     then mig_log "🚨 lag_sec > $LAG_MAX_SEC (slot parado com WAL pendente)"; crit=1; fi

  # Só reanima se ninguém estiver consumindo o slot, e no máximo 1x por minuto.
  if (( crit == 1 && AUTO_DRAIN == 1 )) && [[ "$active" == "false" ]] && (( now - last_spawn >= 60 )); then
    mkdir -p "${CDC_OUT_DIR:-$SCRIPT_DIR/out}"
    mig_log "⚡ AUTO_DRAIN — slot sem consumidor; disparando drain de emergência"
    nohup bash "$SCRIPT_DIR/drain.sh" >>"${CDC_OUT_DIR:-$SCRIPT_DIR/out}/emergency-drain.log" 2>&1 &
    last_spawn=$now
  fi

  if (( ONCE )); then exit "$crit"; fi
  sleep "$POLL_SEC" & wait $! || true
done
