#!/usr/bin/env bash
# =============================================================================
# deploy-all.sh — deploya todas as Edge Functions no NOVO Supabase.
#
# Uso:
#   ./deploy-all.sh                       # deploya todas
#   ./deploy-all.sh --only <nome>         # deploya apenas uma
#   ./deploy-all.sh --from <nome>         # retoma a partir de <nome>
#   ./deploy-all.sh --project-ref <ref>   # sobrescreve DEST_REF
#
# Requer: supabase CLI logado e DEST_REF exportado (ou --project-ref).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
FUNCTIONS_DIR="$REPO_ROOT/supabase/functions"
LOG_FILE="$SCRIPT_DIR/deploy.log"

PROJECT_REF="${DEST_REF:-}"
ONLY=""
FROM=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-ref) PROJECT_REF="$2"; shift 2 ;;
    --only) ONLY="$2"; shift 2 ;;
    --from) FROM="$2"; shift 2 ;;
    *) echo "Argumento desconhecido: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$PROJECT_REF" ]]; then
  echo "ERRO: informe DEST_REF ou --project-ref <ref>" >&2
  exit 2
fi

if [[ ! -d "$FUNCTIONS_DIR" ]]; then
  echo "ERRO: diretório não encontrado: $FUNCTIONS_DIR" >&2
  exit 2
fi

mapfile -t ALL_FUNCS < <(
  find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d \
    -not -name '_shared' -not -name 'tests' \
    -printf '%f\n' | sort
)

TOTAL=${#ALL_FUNCS[@]}
if [[ "$TOTAL" -eq 0 ]]; then
  echo "Nenhuma função encontrada em $FUNCTIONS_DIR" >&2
  exit 1
fi

: > "$LOG_FILE"
echo "Destino: $PROJECT_REF"
echo "Total detectado: $TOTAL"
echo "Log: $LOG_FILE"
echo

started=0
ok=0
fail=0
FAILED_LIST=()

NO_JWT_FUNCTIONS=(
  auto-rebatch-behavioral auto-regen-behavioral-profiles bitrix24-webhook
  check-health-alerts check-notifications client-notifications cs-health-recalc
  deal-room-buyer-view dual-write-proxy evolution-webhook forecast-snapshot-cron
  evolution-bitrix-connector form-submit-handler generate-behavioral-profile
  get-signature incoming-webhook
  lead-score-cron lux-webhook mcp-server mql-evaluator nurturing-runner
  process-behavioral-regen-queue process-webhook-dlq retry-behavioral-profile
  revops-snapshot-builder send-sms-campaign sequence-processor sequence-track
  smart-notify social-events-detector submit-signature sync-social-interests
  template-success-notifications validation-queue-worker weekly-digest
)

requires_custom_auth() {
  local candidate="$1"
  local public_name
  for public_name in "${NO_JWT_FUNCTIONS[@]}"; do
    [[ "$candidate" == "$public_name" ]] && return 0
  done
  return 1
}

for name in "${ALL_FUNCS[@]}"; do
  if [[ -n "$ONLY" && "$name" != "$ONLY" ]]; then
    continue
  fi
  if [[ -n "$FROM" && "$started" -eq 0 ]]; then
    [[ "$name" == "$FROM" ]] && started=1 || continue
  fi

  printf "→ %s ... " "$name"
  deploy_args=(functions deploy "$name" --project-ref "$PROJECT_REF")
  if requires_custom_auth "$name"; then
    deploy_args+=(--no-verify-jwt)
  fi
  if supabase "${deploy_args[@]}" >>"$LOG_FILE" 2>&1; then
    echo "OK"
    ok=$((ok+1))
  else
    echo "FALHOU (ver $LOG_FILE)"
    fail=$((fail+1))
    FAILED_LIST+=("$name")
  fi
  sleep 1
done

echo
echo "===================="
echo "Resumo: OK=$ok  FALHA=$fail  TOTAL_TENTADO=$((ok+fail))"
if [[ "$fail" -gt 0 ]]; then
  echo "Funções que falharam:"
  printf '  - %s\n' "${FAILED_LIST[@]}"
  echo "Retomar com: ./deploy-all.sh --from ${FAILED_LIST[0]}"
  exit 1
fi