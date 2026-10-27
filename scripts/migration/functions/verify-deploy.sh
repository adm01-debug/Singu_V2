#!/usr/bin/env bash
# =============================================================================
# verify-deploy.sh — sanity check pós-deploy.
#
# Faz:
#   1. Lista funções remotas via `supabase functions list`.
#   2. Diff contra o set local (supabase/functions/*).
#   3. Confere HTTP e JSON dos endpoints de health autenticados.
#   4. Alerta se cron.job tem URLs apontando para o project-ref ANTIGO.
#
# Uso:
#   ./verify-deploy.sh --project-ref <novo-ref> [--old-ref <ref-antigo>]
#   (ou exporte DEST_REF e OLD_REF)
#   HEALTH_JWT e SUPABASE_ANON_KEY autenticam os health checks administrativos.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
FUNCTIONS_DIR="$REPO_ROOT/supabase/functions"
REMOTE_LIST="$(mktemp)"
HEALTH_BODY="$(mktemp)"
trap 'rm -f "$REMOTE_LIST" "$HEALTH_BODY"' EXIT

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

supabase functions list --project-ref "$PROJECT_REF" --output json > "$REMOTE_LIST" || {
  echo "ERRO: não consegui listar funções remotas." >&2
  exit 1
}

REMOTE_SLUGS="$(node --input-type=module -e '
  import { readFileSync } from "node:fs";
  const rows = JSON.parse(readFileSync(process.argv[1], "utf8"));
  if (!Array.isArray(rows) || rows.length === 0 || rows.some(row =>
    !row || typeof row.slug !== "string" || !/^[a-z][a-z0-9-]*$/.test(row.slug) || typeof row.status !== "string"
  )) process.exit(1);
  console.log([...new Set(rows.filter(row => row.status === "ACTIVE").map(row => row.slug))].sort().join("\n"));
' "$REMOTE_LIST")" || { echo "ERRO: inventário remoto inválido." >&2; exit 1; }
mapfile -t REMOTE <<< "$REMOTE_SLUGS"
echo "Remotos ativos: ${#REMOTE[@]}"
echo
echo "-- Locais faltando no remoto --"
MISSING="$(comm -23 <(printf '%s\n' "${LOCAL[@]}") <(printf '%s\n' "${REMOTE[@]}"))"
if [[ -n "$MISSING" ]]; then
  printf '%s\n' "$MISSING"
  echo "ERRO: há funções locais ausentes ou inativas no destino." >&2
  exit 1
fi
echo "-- Remotos que nao estao no repo --"
comm -13 <(printf '%s\n' "${LOCAL[@]}") <(printf '%s\n' "${REMOTE[@]}")

echo
echo "== 2. Health endpoints =="
HEALTH_FNS=(health system-health voice-ai-health email-pipeline-health)
# fetchAPI permite 30s por consulta; o fallback de email pode consumir outros 30s.
HEALTH_TIMEOUT_SECONDS=75
CURL_AUTH=()
if [[ -n "${HEALTH_JWT:-}" ]]; then CURL_AUTH+=(-H "Authorization: Bearer $HEALTH_JWT"); fi
if [[ -n "${SUPABASE_ANON_KEY:-}" ]]; then CURL_AUTH+=(-H "apikey: $SUPABASE_ANON_KEY"); fi
FALHAS=0
for fn in "${HEALTH_FNS[@]}"; do
  url="$BASE_URL/$fn"
  if ! code="$(curl -sS --max-time "$HEALTH_TIMEOUT_SECONDS" "${CURL_AUTH[@]}" -o "$HEALTH_BODY" -w '%{http_code}' "$url")"; then
    echo "ERRO: não consegui consultar $fn." >&2
    FALHAS=$((FALHAS + 1))
    continue
  fi
  case "$code" in
    200)
      if node --input-type=module -e '
        import { readFileSync } from "node:fs";
        try { process.exit(JSON.parse(readFileSync(process.argv[1], "utf8"))?.status === "healthy" ? 0 : 1); }
        catch { process.exit(1); }
      ' "$HEALTH_BODY"; then
        echo "  ok $fn -> HTTP 200, healthy"
      else
        echo "ERRO: $fn -> HTTP 200 sem JSON de saúde healthy." >&2
        FALHAS=$((FALHAS + 1))
      fi ;;
    *) echo "ERRO: $fn -> HTTP $code; saúde não confirmada." >&2; FALHAS=$((FALHAS + 1)) ;;
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
if [[ "$FALHAS" -gt 0 ]]; then
  echo "ERRO: $FALHAS endpoint(s) sem confirmação de saúde." >&2
  exit 1
fi
echo "OK - inventário ativo e health checks verificados; revise os agendamentos no banco."