#!/usr/bin/env bash
# ============================================================================
# rewrite-cron-urls.sh — GERA (não executa) o SQL que troca o ref do projeto
# antigo pelo novo em cron.job.command. Não conecta em banco nenhum.
#
# Uso: OLD_REF=abc NEW_REF=xyz ./rewrite-cron-urls.sh > /tmp/rewrite.sql
#      psql "$DEST_DB_URL" -v ON_ERROR_STOP=1 -f /tmp/rewrite.sql
# Ambiente (scripts/migration/.env; ambiente vence): OLD_REF, NEW_REF — refs de
#   projeto Supabase (só a-z e 0-9, 15 a 30 caracteres).
#
# O SQL gerado roda numa transação, usa cron.alter_job (forma suportada pelo
# pg_cron/Supabase), é idempotente e lista os jobs com JWT embutido — esses
# costumam carregar a chave do projeto ANTIGO e precisam de ajuste manual.
# Exit: 0 SQL gerado · 2 OLD_REF/NEW_REF ausentes, inválidos ou iguais.
# ============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$SCRIPT_DIR/../_lib.sh"
MIG_TAG="rewrite-cron"

case "${1:-}" in
  -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
esac

mig_load_env "$SCRIPT_DIR/../.env" "$SCRIPT_DIR/../env.migration"
[[ -n "${OLD_REF:-}" ]] || mig_die 2 "defina OLD_REF (ref do projeto antigo, ex: hjhthvzwtvwgdrochcam)"
[[ -n "${NEW_REF:-}" ]] || mig_die 2 "defina NEW_REF (ref do projeto novo)"
# Validação estrita: o ref entra em literal SQL — nada de aspas, % ou _.
for v in OLD_REF NEW_REF; do
  [[ "${!v}" =~ ^[a-z0-9]{15,30}$ ]] || mig_die 2 "$v inválido: esperado ref Supabase (a-z, 0-9, 15–30 caracteres)"
done
[[ "$OLD_REF" != "$NEW_REF" ]] || mig_die 2 "OLD_REF e NEW_REF são iguais — nada a reescrever"

cat <<SQL
-- Rewrite gerado em $(date -u +%FT%TZ)
-- OLD_REF=$OLD_REF NEW_REF=$NEW_REF
BEGIN;

-- Preview: linhas afetadas
SELECT jobid, jobname, command
FROM cron.job
WHERE strpos(command, '$OLD_REF') > 0;

-- Aplica (cron.alter_job é a forma suportada; UPDATE direto em cron.job é negado no Supabase)
SELECT cron.alter_job(jobid, command := replace(command, '$OLD_REF', '$NEW_REF'))
FROM cron.job
WHERE strpos(command, '$OLD_REF') > 0;

-- Verificação: tem de ser 0
SELECT count(*) AS remanescentes FROM cron.job WHERE strpos(command, '$OLD_REF') > 0;

-- ATENÇÃO: jobs com JWT embutido (provável chave do projeto antigo) — revisar à mão
SELECT jobid, jobname FROM cron.job WHERE command ~ 'eyJ[A-Za-z0-9_-]{10,}\.eyJ';

COMMIT;
SQL
