#!/usr/bin/env bash
# =============================================================================
# deploy-all.sh — deploya todas as Edge Functions no NOVO Supabase.
#
# Uso:
#   ./deploy-all.sh                       # deploya todas (pede confirmação)
#   ./deploy-all.sh --only <nome>         # deploya apenas uma
#   ./deploy-all.sh --from <nome>         # retoma a partir de <nome>
#   ./deploy-all.sh --project-ref <ref>   # sobrescreve DEST_REF
#   ./deploy-all.sh --dry-run             # lista o que faria, sem chamar a CLI
#   ./deploy-all.sh --yes                 # sem pergunta (ou CONFIRM=<ref>)
#
# Requer: supabase CLI logado e DEST_REF (ou NEW_REF) exportado, ou --project-ref.
# Ambiente opcional: DEPLOY_SLEEP_SEC (pausa entre deploys, padrão 1),
#   DEPLOY_LOG (padrão functions/deploy.log), FUNCTIONS_DIR.
#
# Publica só pastas com index.ts; as da lista NO_JWT_FUNCTIONS vão com
# --no-verify-jwt (webhooks/cron autenticam por segredo próprio). --only/--from
# com nome inexistente é erro. O log passa por um filtro que mascara tokens.
# Exit: 0 todas ok · 1 alguma falhou (lista + comando para retomar) · 2 uso,
#       config, CLI ausente ou confirmação negada · 130 interrompido.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$SCRIPT_DIR/../_lib.sh"
MIG_TAG="deploy"

mig_load_env "$SCRIPT_DIR/../.env" "$SCRIPT_DIR/../env.migration"
FUNCTIONS_DIR="${FUNCTIONS_DIR:-$REPO_ROOT/supabase/functions}"
LOG_FILE="${DEPLOY_LOG:-$SCRIPT_DIR/deploy.log}"
SLEEP_SEC="${DEPLOY_SLEEP_SEC:-1}"

PROJECT_REF="${DEST_REF:-${NEW_REF:-}}"
ONLY=""
FROM=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-ref) mig_opt_arg "$1" $#; PROJECT_REF="$2"; shift 2 ;;
    --only) mig_opt_arg "$1" $#; ONLY="$2"; shift 2 ;;
    --from) mig_opt_arg "$1" $#; FROM="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --yes) MIG_YES=1; shift ;;
    -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    *) mig_die 2 "Argumento desconhecido: $1 (veja --help)" ;;
  esac
done

[[ -n "$PROJECT_REF" ]] || mig_die 2 "ERRO: informe DEST_REF ou --project-ref <ref>"
[[ "$PROJECT_REF" =~ ^[a-z0-9]{15,30}$ ]] || mig_die 2 "project-ref inválido: $PROJECT_REF"
[[ -d "$FUNCTIONS_DIR" ]] || mig_die 2 "ERRO: diretório não encontrado: $FUNCTIONS_DIR"
mig_is_uint "$SLEEP_SEC" || mig_die 2 "DEPLOY_SLEEP_SEC inválido: $SLEEP_SEC"
[[ -z "$ONLY" || -z "$FROM" ]] || mig_die 2 "use --only OU --from, não os dois"

ALL_FUNCS=()
while IFS= read -r d; do
  n="$(basename "$d")"
  [[ "$n" == "_shared" || "$n" == "tests" ]] && continue
  if [[ -f "$d/index.ts" ]]; then ALL_FUNCS+=("$n"); else mig_err "⚠ ignorando $n (sem index.ts)"; fi
done < <(find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d | LC_ALL=C sort)

TOTAL=${#ALL_FUNCS[@]}
[[ "$TOTAL" -gt 0 ]] || mig_die 2 "Nenhuma função encontrada em $FUNCTIONS_DIR"

NO_JWT_FUNCTIONS=(
  auto-rebatch-behavioral auto-regen-behavioral-profiles bitrix24-webhook
  check-health-alerts check-notifications client-notifications cs-health-recalc
  deal-room-buyer-view dual-write-proxy evolution-webhook forecast-snapshot-cron
  evolution-bitrix-connector form-submit-handler generate-behavioral-profile
  get-signature incoming-webhook
  intent-pixel-snippet intent-tracker lead-score-cron lux-webhook mcp-server
  mql-evaluator nurturing-runner
  process-behavioral-regen-queue process-webhook-dlq retry-behavioral-profile
  revops-snapshot-builder send-sms-campaign sequence-processor sequence-track
  smart-notify social-events-detector submit-signature sync-product-catalog sync-social-interests
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

in_list() { local x; for x in "${ALL_FUNCS[@]}"; do [[ "$x" == "$1" ]] && return 0; done; return 1; }
if [[ -n "$ONLY" ]] && ! in_list "$ONLY"; then mig_die 2 "--only $ONLY: função não existe em $FUNCTIONS_DIR"; fi
if [[ -n "$FROM" ]] && ! in_list "$FROM"; then mig_die 2 "--from $FROM: função não existe em $FUNCTIONS_DIR"; fi
for name in "${NO_JWT_FUNCTIONS[@]}"; do
  in_list "$name" || mig_err "⚠ $name está na lista --no-verify-jwt mas não existe localmente (renomeada?)"
done

# seleção
SELECTED=(); started=0
for name in "${ALL_FUNCS[@]}"; do
  if [[ -n "$ONLY" && "$name" != "$ONLY" ]]; then continue; fi
  if [[ -n "$FROM" && "$started" -eq 0 ]]; then
    if [[ "$name" == "$FROM" ]]; then started=1; else continue; fi
  fi
  SELECTED+=("$name")
done

echo "Destino: $PROJECT_REF"
echo "Total detectado: $TOTAL · selecionadas: ${#SELECTED[@]}"

if (( DRY_RUN )); then
  for name in "${SELECTED[@]}"; do
    echo "  [dry-run] supabase functions deploy $name --project-ref $PROJECT_REF$(requires_custom_auth "$name" && echo ' --no-verify-jwt')"
  done
  echo "[dry-run] nada foi publicado."
  exit 0
fi

mig_need supabase
mig_confirm "Isto PUBLICA ${#SELECTED[@]} Edge Function(s) no projeto $PROJECT_REF." "$PROJECT_REF"

umask 077
: > "$LOG_FILE"
echo "Log: $LOG_FILE"
echo

ok=0
fail=0
FAILED_LIST=()
CURRENT=""
summary() {
  echo
  echo "===================="
  echo "Resumo: OK=$ok  FALHA=$fail  TOTAL_TENTADO=$((ok+fail))  SELECIONADAS=${#SELECTED[@]}"
}
on_signal() {
  summary
  echo "INTERROMPIDO durante: ${CURRENT:-<início>}. Retomar com: ./deploy-all.sh --from ${CURRENT:-${SELECTED[0]}}" >&2
  exit 130
}
trap on_signal INT TERM

for name in "${SELECTED[@]}"; do
  CURRENT="$name"
  printf "→ %s ... " "$name"
  deploy_args=(functions deploy "$name" --project-ref "$PROJECT_REF")
  if requires_custom_auth "$name"; then
    deploy_args+=(--no-verify-jwt)
  fi
  printf '=== %s %s\n' "$(mig_ts)" "$name" >> "$LOG_FILE"
  if supabase "${deploy_args[@]}" 2>&1 | mig_redact >> "$LOG_FILE"; then
    echo "OK"
    ok=$((ok+1))
  else
    echo "FALHOU (ver $LOG_FILE)"
    fail=$((fail+1))
    FAILED_LIST+=("$name")
  fi
  if (( SLEEP_SEC > 0 )); then sleep "$SLEEP_SEC"; fi
done

summary
if [[ "$fail" -gt 0 ]]; then
  echo "Funções que falharam:"
  printf '  - %s\n' "${FAILED_LIST[@]}"
  echo "Retomar com: ./deploy-all.sh --from ${FAILED_LIST[0]}"
  exit 1
fi
