#!/usr/bin/env bash
# planner-stats-freshness.sh — ANALYZE + verifica frescor de estatisticas do planner.
# Sem ANALYZE, planner usa defaults -> seq scan em vez de index.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${DEST_DB_URL:?DEST_DB_URL obrigatorio}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-24}"

log() { printf '[planner-stats %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

log "rodando ANALYZE global..."
psql "$DEST_DB_URL" -v ON_ERROR_STOP=1 -c "ANALYZE;" >/dev/null
log "OK ANALYZE concluido"

log "verificando frescor de estatisticas (> ${MAX_AGE_HOURS}h)..."
STALE=$(psql "$DEST_DB_URL" -Atqc "
  SELECT COUNT(*) FROM pg_stat_user_tables
   WHERE schemaname = 'public'
     AND (last_analyze IS NULL AND last_autoanalyze IS NULL
          OR GREATEST(COALESCE(last_analyze,'epoch'::timestamptz),
                      COALESCE(last_autoanalyze,'epoch'::timestamptz))
             < now() - interval '${MAX_AGE_HOURS} hours');
")

if [[ "$STALE" -gt 0 ]]; then
  log "ALERTA $STALE tabela(s) com estatisticas stale > ${MAX_AGE_HOURS}h"
  psql "$DEST_DB_URL" -c "
    SELECT schemaname || '.' || relname AS table_name,
           last_analyze, last_autoanalyze, n_live_tup
      FROM pg_stat_user_tables
     WHERE schemaname = 'public'
       AND (last_analyze IS NULL AND last_autoanalyze IS NULL
            OR GREATEST(COALESCE(last_analyze,'epoch'::timestamptz),
                        COALESCE(last_autoanalyze,'epoch'::timestamptz))
               < now() - interval '${MAX_AGE_HOURS} hours')
     ORDER BY n_live_tup DESC LIMIT 20;
  "
  exit 1
fi
log "OK Estatisticas frescas em todas as tabelas public.*"