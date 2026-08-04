#!/usr/bin/env bash
# Chaos Drill — injeta falhas controladas em STAGING para validar resposta.
# NUNCA rode em produção. Requer STAGING_CONFIRM=1.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${STAGING_CONFIRM:?exporte STAGING_CONFIRM=1 e confirme que SRC_DB_URL/DEST_DB_URL apontam para STAGING}"
: "${SCENARIO:?defina SCENARIO=<kill-drain|corrupt-checkpoint|revoke-grant|slot-full|dns-stale>}"
: "${SRC_DB_URL:?}"
: "${DEST_DB_URL:?}"

log() { printf '[chaos %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

case "$SCENARIO" in
  kill-drain)
    log "→ matando processos pg_recvlogical"
    pkill -TERM -f 'pg_recvlogical.*migration_slot' || log "nenhum drain rodando"
    log "esperado: cdc/lag-watch.sh detecta lag crescente em <30s"
    ;;
  corrupt-checkpoint)
    log "→ corrompendo _migration_cdc_checkpoint (inserindo LSN inválido)"
    psql "$DEST_DB_URL" -c "INSERT INTO public._migration_cdc_checkpoint(lsn) VALUES ('CHAOS/BADLSN') ON CONFLICT DO NOTHING;"
    log "esperado: cdc/replay.ts ignora LSN inválido, continua idempotente"
    ;;
  revoke-grant)
    log "→ revogando SELECT em public.contacts (destino) por 60s"
    psql "$DEST_DB_URL" -c "REVOKE SELECT ON public.contacts FROM authenticated;"
    ( sleep 60 && psql "$DEST_DB_URL" -c "GRANT SELECT ON public.contacts TO authenticated;" && log "grant restaurado" ) &
    log "esperado: smoke-tests.ts falha em <10s; erro de permissão logado"
    ;;
  slot-full)
    log "→ pausando drain para inflar slot"
    pkill -STOP -f 'pg_recvlogical.*migration_slot' || true
    log "esperado: lag-watch.sh detecta lag_bytes crescente; AUTO_DRAIN reanima"
    log "reverter: pkill -CONT -f pg_recvlogical"
    ;;
  dns-stale)
    log "→ simulação (dry): rode verify/dns-multi-region.sh com EXPECTED errado"
    log "esperado: script sai com código 1 e lista resolvers divergentes"
    ;;
  *)
    log "SCENARIO desconhecido: $SCENARIO"; exit 2;;
esac

log "✔ Cenário '$SCENARIO' injetado. Verifique docs/CHAOS_DRILL.md para resposta esperada."