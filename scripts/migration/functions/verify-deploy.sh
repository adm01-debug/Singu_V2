#!/usr/bin/env bash
# =============================================================================
# verify-deploy.sh — sanity check pós-deploy.
#
# Faz:
#   1. Lista funções remotas via `supabase functions list`.
#   2. Diff contra o set local (supabase/functions/*).
#   3. curl -I nos endpoints de health públicos.
#   4. Alerta se cron.job tem URLs apontando para o project-ref ANTIGO.
#
# Uso:
#   ./verify-deploy.sh --project-ref <novo-ref> [--old-ref <ref-antigo>]
#   (ou exporte DEST_REF e OLD_REF)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
FUNCTIONS_DIR="$REPO_ROOT/supabase/functions"
REMOTE_LIST="$SCRIPT_DIR/remote-functions.txt"

PROJECT_REF="${DEST_REF:-}"
OLD_REF="${OLD_REF:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-ref) PROJECT_REF="$2"; shift 2 ;;
    --old-ref)     OLD_REF="$2"; shift 2 ;;
    *) echo "Argumento desconhecido: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$PROJECT_REF" ]]; then
  echo "ERRO: informe DEST_REF ou --project-ref <ref>" >&2
  exit 2
fi

BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1"

echo "== 1. Local vs remoto =="
mapfile -t LOCAL < <(
  find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d \
    -not -name '_shared' -not -name 'tests' -printf '%f\n' | sort
)
echo "Locais: ${#LOCAL[@]}"

supabase functions list --project-ref "$PROJECT_REF" > "$REMOTE_LIST" 2>/dev/null || {
  echo "AVISO: não consegui listar funções remotas (CLI antiga?)."
}

if [[ -s "$REMOTE_LIST" ]]; then
  mapfile -t REMOTE < <(awk 'NR>1 {for(i=1;i<=NF;i++) if ($i ~ /^[a-z][a-z0-9-]+$/) {print $i; next}}' "$REMOTE_LIST" | sort -u)
  echo "Remotos: ${#REMOTE[@]}"
  echo
  echo "-- Locais faltando no remoto --"
  comm -23 <(printf '%s\n' "${LOCAL[@]}") <(printf '%s\n' "${REMOTE[@]}") || true
  echo "-- Remotos que nao estao no repo --"
  comm -13 <(printf '%s\n' "${LOCAL[@]}") <(printf '%s\n' "${REMOTE[@]}") || true
fi

echo
echo "== 2. Health endpoints =="
HEALTH_FNS=(health system-health voice-ai-health email-pipeline-health)
for fn in "${HEALTH_FNS[@]}"; do
  url="$BASE_URL/$fn"
  code="$(curl -s -o /dev/null -w '%{http_code}' -I "$url" || echo '000')"
  case "$code" in
    200|401) echo "  ok $fn  -> HTTP $code" ;;
    404)     echo "  !! $fn  -> HTTP 404 (nao deployada?)" ;;
    *)       echo "  ?  $fn  -> HTTP $code" ;;
  esac
done

echo
echo "== 3. Cron jobs (revise no banco de destino) =="
if [[ -n "$OLD_REF" ]]; then
  cat <<SQL
-- Rode no banco de DESTINO para checar URLs de cron ainda apontando para o antigo:
SELECT jobid, jobname, command
  FROM cron.job
 WHERE command ILIKE '%${OLD_REF}.supabase.co%';

-- Se aparecerem linhas, atualize com:
-- SELECT cron.alter_job(jobid, command := REPLACE(command,'${OLD_REF}','${PROJECT_REF}'))
--   FROM cron.job WHERE command ILIKE '%${OLD_REF}%';
SQL
else
  echo "(informe --old-ref para gerar o SQL de auditoria de cron)"
fi

echo
echo "OK - revise itens marcados com !! ou ?."