#!/usr/bin/env bash
# Gera SQL para reescrever URLs de projetos antigos em cron.job.command.
# Uso: OLD_REF=abc NEW_REF=xyz ./rewrite-cron-urls.sh > /tmp/rewrite.sql
#      psql "$DEST_DB_URL" -f /tmp/rewrite.sql
set -euo pipefail
: "${OLD_REF:?defina OLD_REF (ref do projeto antigo, ex: hjhthvzwtvwgdrochcam)}"
: "${NEW_REF:?defina NEW_REF (ref do projeto novo)}"

cat <<SQL
-- Rewrite gerado em $(date -u +%FT%TZ)
-- OLD_REF=$OLD_REF NEW_REF=$NEW_REF
BEGIN;

-- Preview: linhas afetadas
SELECT jobid, jobname, command
FROM cron.job
WHERE command LIKE '%$OLD_REF%';

-- Aplica
UPDATE cron.job
SET command = replace(command, '$OLD_REF', '$NEW_REF')
WHERE command LIKE '%$OLD_REF%';

-- Verificação
SELECT count(*) AS remanescentes FROM cron.job WHERE command LIKE '%$OLD_REF%';

COMMIT;
SQL
