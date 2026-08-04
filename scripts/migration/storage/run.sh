#!/usr/bin/env bash
# Wrapper: list-buckets → create-buckets → copy-objects → verify-counts.
# Uso:
#   ./run.sh               # pipeline completo
#   ./run.sh --only documents
#   ./run.sh --dry-run
#   ./run.sh --step copy   # steps: list|create|copy|verify|all (default all)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f .env ]]; then
  echo "✖ .env ausente em $SCRIPT_DIR — copie env.example e preencha."
  exit 2
fi
# shellcheck disable=SC2046
export $(grep -Ev '^(#|$)' .env | xargs -d '\n')

STEP="all"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only) export ONLY_BUCKET="$2"; shift 2;;
    --dry-run) export DRY_RUN=1; shift;;
    --step) STEP="$2"; shift 2;;
    *) echo "Flag desconhecida: $1"; exit 2;;
  esac
done

DENO_FLAGS="--allow-env --allow-net --allow-read --allow-write"

run() { echo -e "\n=== $1 ==="; deno run $DENO_FLAGS "$2"; }

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
  *) echo "Step inválido: $STEP"; exit 2;;
esac