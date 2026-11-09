#!/usr/bin/env bash
# planner-stats-freshness.sh — ANALYZE + verifica frescor de estatisticas do planner.
# Sem ANALYZE, planner usa defaults -> seq scan em vez de index.
#
# Uso: DEST_DB_URL=... [MAX_AGE_HOURS=24] [SKIP_ANALYZE=1] ./planner-stats-freshness.sh [--sem-analyze]
# ATENCAO: por padrao roda ANALYZE no banco inteiro (grava estatisticas; nao altera dados,
#          mas consome IO). Use --sem-analyze / SKIP_ANALYZE=1 para so verificar.
# Codigos de saida: 0 = estatisticas frescas; 1 = tabela(s) de public sem ANALYZE recente;
#                   2 = erro de uso ou comando falhou.
set -euo pipefail
export LC_ALL=C

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

SKIP_ANALYZE="${SKIP_ANALYZE:-0}"
case "${1:-}" in
  "") ;;
  --sem-analyze) SKIP_ANALYZE=1 ;;
  -h|--help) sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0 ;;
  *) echo "ERRO: argumento desconhecido: $1 (veja --help)" >&2; exit 2 ;;
esac
[[ -n "${DEST_DB_URL:-}" ]] || { echo "ERRO: DEST_DB_URL obrigatorio" >&2; exit 2; }
MAX_AGE_HOURS="${MAX_AGE_HOURS:-24}"
[[ "$MAX_AGE_HOURS" =~ ^[0-9]+([.][0-9]+)?$ ]] || { echo "ERRO: MAX_AGE_HOURS invalido: $MAX_AGE_HOURS" >&2; exit 2; }
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"

log() { printf '[planner-stats %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

if [[ "$SKIP_ANALYZE" == 1 ]]; then
  log "ANALYZE pulado (--sem-analyze)"
else
  log "rodando ANALYZE global..."
  psql "$DEST_DB_URL" -X -v ON_ERROR_STOP=1 -c "ANALYZE;" >/dev/null \
    || { echo "ERRO: ANALYZE falhou." >&2; exit 2; }
  log "OK ANALYZE concluido"
fi

# Tabela nunca analisada, ou analisada ha mais de MAX_AGE_HOURS. (MAX_AGE_HOURS ja foi
# validado como numero; pg_stat_user_tables pode levar ~1s para refletir o ANALYZE.)
FILTRO="schemaname = 'public'
     AND (last_analyze IS NULL AND last_autoanalyze IS NULL
          OR GREATEST(COALESCE(last_analyze,'epoch'::timestamptz),
                      COALESCE(last_autoanalyze,'epoch'::timestamptz))
             < now() - ${MAX_AGE_HOURS} * interval '1 hour')"

log "verificando frescor de estatisticas (> ${MAX_AGE_HOURS}h)..."
STALE=""
for _ in 1 2 3; do
  STALE=$(psql "$DEST_DB_URL" -X -Atq -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM pg_stat_user_tables WHERE $FILTRO;") \
    || { echo "ERRO: consulta de frescor falhou." >&2; exit 2; }
  [[ "$STALE" == 0 || "$SKIP_ANALYZE" == 1 ]] && break
  sleep 1
done
[[ "$STALE" =~ ^[0-9]+$ ]] || { echo "ERRO: resposta inesperada do destino: '$STALE'" >&2; exit 2; }

if [[ "$STALE" -gt 0 ]]; then
  log "ALERTA $STALE tabela(s) com estatisticas stale > ${MAX_AGE_HOURS}h"
  psql "$DEST_DB_URL" -X -c "
    SELECT schemaname || '.' || relname AS table_name,
           last_analyze, last_autoanalyze, n_live_tup
      FROM pg_stat_user_tables
     WHERE $FILTRO
     ORDER BY n_live_tup DESC LIMIT 20;
  " || true
  exit 1
fi
log "OK Estatisticas frescas em todas as tabelas public.*"
