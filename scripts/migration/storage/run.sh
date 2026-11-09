#!/usr/bin/env bash
# ============================================================================
# run.sh — wrapper do pipeline de Storage:
#   list-buckets → create-buckets → copy-objects → verify-counts.
#
# Uso:
#   ./run.sh               # pipeline completo (pede confirmação: escreve no destino)
#   ./run.sh --only documents
#   ./run.sh --dry-run     # não escreve no destino (não pede confirmação)
#   ./run.sh --step copy   # steps: list|create|copy|verify|all (default all)
#   ./run.sh --yes         # sem pergunta (ou CONFIRM=<host do destino>)
#
# Configuração: storage/.env (copie de env.example) e/ou scripts/migration/.env.
# O arquivo é LIDO (não executado) e o ambiente vence: `CONCURRENCY=16 ./run.sh
# --step copy` vale mesmo com CONCURRENCY=8 no arquivo. Valores entre aspas
# perdem as aspas. STORAGE_ENV_FILE aponta para outro arquivo.
# Obrigatórias: SRC_SUPABASE_URL, SRC_SERVICE_ROLE_KEY, DEST_SUPABASE_URL,
#   DEST_SERVICE_ROLE_KEY.
# Um step que falha interrompe o pipeline (os seguintes não rodam).
# Exit: 0 ok · código do step que falhou · 2 uso/config/confirmação negada.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$SCRIPT_DIR/../_lib.sh"
MIG_TAG="storage"
cd "$SCRIPT_DIR"

STEP="all"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only) mig_opt_arg "$1" $#; export ONLY_BUCKET="$2"; shift 2;;
    --dry-run) export DRY_RUN=1; shift;;
    --step) mig_opt_arg "$1" $#; STEP="$2"; shift 2;;
    --yes) MIG_YES=1; shift;;
    -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0;;
    *) mig_die 2 "Flag desconhecida: $1 (veja --help)";;
  esac
done
case "$STEP" in
  list|create|copy|verify|all) ;;
  *) mig_die 2 "Step inválido: $STEP (use list|create|copy|verify|all)";;
esac

ENV_FILE="${STORAGE_ENV_FILE:-$SCRIPT_DIR/.env}"
if [[ ! -f "$ENV_FILE" && ! -f "$SCRIPT_DIR/../.env" ]]; then
  mig_die 2 "✖ .env ausente em $SCRIPT_DIR — copie env.example e preencha."
fi
mig_load_env "$ENV_FILE" "$SCRIPT_DIR/../.env"
for v in SRC_SUPABASE_URL SRC_SERVICE_ROLE_KEY DEST_SUPABASE_URL DEST_SERVICE_ROLE_KEY; do
  [[ -n "${!v:-}" ]] || mig_die 2 "$v não definido (veja storage/env.example)"
done
# ONLY_BUCKET vazio no arquivo = sem filtro
if [[ -z "${ONLY_BUCKET:-}" ]]; then unset ONLY_BUCKET; fi
mig_need deno

DEST_HOST="$(mig_target "$DEST_SUPABASE_URL")"
if [[ "${DRY_RUN:-0}" != "1" && "$STEP" =~ ^(create|copy|all)$ ]]; then
  mig_confirm "Isto CRIA buckets e/ou COPIA objetos para o Storage de $DEST_HOST." "$DEST_HOST"
fi

DENO_FLAGS=(--allow-env --allow-net --allow-read --allow-write)

run() {
  echo -e "\n=== $1 ==="
  deno run "${DENO_FLAGS[@]}" "$2" || { rc=$?; mig_err "✖ step '$1' falhou (código $rc) — pipeline interrompido"; exit "$rc"; }
}

case "$STEP" in
  list)    run "list-buckets"   list-buckets.ts;;
  create)  run "create-buckets" create-buckets.ts;;
  copy)    run "copy-objects"   copy-objects.ts;;
  verify)  run "verify-counts"  verify-counts.ts;;
  all)
    run "list-buckets"   list-buckets.ts
    run "create-buckets" create-buckets.ts
    run "copy-objects"   copy-objects.ts
    run "verify-counts"  verify-counts.ts
    ;;
esac
