#!/usr/bin/env bash
# freeze-origin.sh — Coloca a origem em modo read-only durante a janela de cutover.
# - Revoga INSERT/UPDATE/DELETE/TRUNCATE de authenticated/anon em schemas de app
# - Pausa todos os cron.jobs (via cron.unschedule)
# - Salva snapshot de privilégios e jobs em freeze-state/<timestamp>/ para rollback
set -euo pipefail

: "${SRC_DB_URL:?SRC_DB_URL é obrigatório}"
SCHEMAS=("public")
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="freeze-state/${TS}"
mkdir -p "$OUT"

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

log() { printf '[freeze %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

log "Snapshot de privilégios → $OUT/privileges.sql"
psql "$SRC_DB_URL" -Atqc "
SELECT format(
  'GRANT %s ON TABLE %I.%I TO %I;',
  string_agg(privilege_type, ', '),
  table_schema, table_name, grantee
)
FROM information_schema.role_table_grants
WHERE grantee IN ('authenticated','anon')
  AND table_schema = ANY (ARRAY[$(printf "'%s'," "${SCHEMAS[@]}" | sed 's/,$//')])
GROUP BY table_schema, table_name, grantee;
" > "$OUT/privileges.sql"

log "Snapshot de crons → $OUT/cron_jobs.sql"
psql "$SRC_DB_URL" -Atqc "
SELECT format('SELECT cron.schedule(%L,%L,%L);', jobname, schedule, command)
FROM cron.job;
" > "$OUT/cron_jobs.sql" || log "AVISO: extensão pg_cron ausente (ok em dev)."

if [[ "$DRY_RUN" == "1" ]]; then
  log "DRY-RUN concluído. Nada foi modificado. Snapshots em $OUT."
  exit 0
fi

log "Revogando escrita em ${SCHEMAS[*]} para authenticated/anon…"
for schema in "${SCHEMAS[@]}"; do
  psql "$SRC_DB_URL" -v ON_ERROR_STOP=1 <<SQL
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA ${schema} FROM authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES FROM authenticated, anon;
SQL
done

log "Pausando cron.jobs…"
psql "$SRC_DB_URL" -Atqc "SELECT cron.unschedule(jobid) FROM cron.job;" > "$OUT/unscheduled.log" 2>&1 || true

cat > "$OUT/UNFREEZE.md" <<EOF
# Como reverter o freeze desta janela

\`\`\`bash
psql "\$SRC_DB_URL" -f $OUT/privileges.sql
psql "\$SRC_DB_URL" -f $OUT/cron_jobs.sql
\`\`\`
EOF

log "Origem congelada com sucesso. Snapshots + instruções em $OUT/"