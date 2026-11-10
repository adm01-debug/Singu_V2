#!/usr/bin/env bash
# ============================================================================
# dashboard.sh — painel de progresso da janela de migração (somente leitura).
#
# Uso:
#   ./dashboard.sh            # atualiza até Ctrl+C (sai limpo, código 0)
#   ./dashboard.sh --once     # desenha uma vez e sai (bom para log/cron)
# Ambiente (scripts/migration/.env ou env.migration; ambiente vence):
#   DEST_DB_URL (ou TARGET_DB_URL)  destino — obrigatória
#   WINDOW_MIN   janela alvo em minutos (padrão 240)
#   REFRESH_SEC  intervalo de atualização (padrão 10)
# Exit: 0 ok/interrompido pelo operador · 1 (só com --once) destino inacessível
#       · 2 uso/config.
# ============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"
MIG_TAG="dashboard"

ONCE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --once)    ONCE=1; shift ;;
    -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
  esac
done

mig_load_env "$SCRIPT_DIR/.env" "$SCRIPT_DIR/env.migration"
mig_alias DEST_DB_URL TARGET_DB_URL
[[ -n "${DEST_DB_URL:-}" ]] || mig_die 2 "defina DEST_DB_URL"
WINDOW_MIN="${WINDOW_MIN:-240}"
REFRESH_SEC="${REFRESH_SEC:-10}"
mig_is_uint "$WINDOW_MIN"  || mig_die 2 "WINDOW_MIN inválido: $WINDOW_MIN"
if ! mig_is_uint "$REFRESH_SEC" || (( REFRESH_SEC < 1 )); then mig_die 2 "REFRESH_SEC inválido: $REFRESH_SEC"; fi
mig_need psql

START="$(date +%s)"
trap 'echo; echo "(dashboard encerrado)"; exit 0' INT TERM

# section <título> <fallback> <sql> — imprime o resultado ou o fallback se a consulta falhar
DB_OK=1
section() {
  local out
  echo "▶ $1"
  if out="$(mig_psql "$DEST_DB_URL" -XtA -F ' | ' -v ON_ERROR_STOP=1 -c "$3" 2>/dev/null)"; then
    if [[ -n "$out" ]]; then printf '%s\n' "$out" | while IFS= read -r l; do echo "  $l"; done; else echo "  (vazio)"; fi
  else
    echo "  $2"
    return 1
  fi
}

draw() {
  local now elapsed left
  now=$(date +%s)
  elapsed=$(( (now - START) / 60 )); left=$(( WINDOW_MIN - elapsed ))
  echo "═══ Migration Dashboard ═══════════════════════════════════════"
  echo "  Decorrido: ${elapsed}m / ${WINDOW_MIN}m    Restante: ${left}m"
  echo "───────────────────────────────────────────────────────────────"
  DB_OK=1
  section "Dados (linhas por tabela — top 10, estimativa):" "(sem acesso ao DB)" \
    "SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE schemaname='public' ORDER BY n_live_tup DESC, relname LIMIT 10" || DB_OK=0
  echo ""
  section "Storage (contagem por bucket):" "(sem acesso a storage.objects)" \
    "SELECT bucket_id, count(*) FROM storage.objects GROUP BY 1 ORDER BY 1" || true
  echo ""
  section "Auth (usuários | identities | pendentes de reset):" "(sem acesso a auth)" \
    "SELECT (SELECT count(*) FROM auth.users), (SELECT count(*) FROM auth.identities),
            (SELECT count(*) FROM auth.users WHERE raw_user_meta_data ? 'must_reset_password')" || true
  echo ""
  section "Cron (jobs | ativos):" "(pg_cron ausente ou sem acesso)" \
    "SELECT count(*), count(*) FILTER (WHERE active) FROM cron.job" || true
  echo ""
}

if (( ONCE )); then
  draw
  (( DB_OK )) || exit 1
  exit 0
fi
while true; do
  if [[ -t 1 ]]; then clear 2>/dev/null || true; fi
  draw
  echo "═══ (atualiza a cada ${REFRESH_SEC}s — Ctrl+C sai) ════════════════════════"
  sleep "$REFRESH_SEC" &
  wait $! || true
done
