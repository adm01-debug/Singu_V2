#!/usr/bin/env bash
# ============================================================================
# freeze-origin.sh — coloca a ORIGEM em modo somente-leitura na janela de
# cutover, de forma verificável e reversível.
#
# O que faz (numa única transação — ou congela tudo, ou nada):
#   - revoga INSERT/UPDATE/DELETE/TRUNCATE de authenticated/anon nas tabelas
#     (e nos privilégios padrão do usuário atual) dos schemas de app;
#   - pausa os cron.jobs ativos (cron.alter_job; cron.unschedule se antigo);
#   - com --strict: ALTER ROLE authenticator SET default_transaction_read_only
#     (bloqueia também service_role e RPC SECURITY DEFINER via API) e derruba
#     as conexões abertas do authenticator;
#   - grava snapshot em <estado>/<timestamp>/ e marca <estado>/CURRENT;
#   - CONFERE que nenhum papel congelado ainda consegue escrever.
#
# Uso:
#   ./cutover/freeze-origin.sh --dry-run          # snapshot + plano, nada muda
#   ./cutover/freeze-origin.sh [--strict] [--yes] # congela (pede confirmação)
#   ./cutover/freeze-origin.sh --status           # congelado? confere de novo
#   ./cutover/freeze-origin.sh --unfreeze [--yes] # desfaz pelo snapshot CURRENT
#
# Ambiente (scripts/migration/.env; ambiente vence):
#   SRC_DB_URL (ou SOURCE_DB_URL)  origem — obrigatória
#   FREEZE_STATE_DIR  pasta de estado (padrão ./freeze-state, relativo ao cwd)
#   FREEZE_ROLES      papéis congelados (padrão "authenticated anon")
#   FREEZE_SCHEMAS    schemas congelados (padrão "public")
#   CONFIRM=<host:porta/banco>  confirma sem terminal (alternativa a --yes)
#
# Idempotente: rodar com freeze ativo não cria snapshot novo (o snapshot do
# estado ORIGINAL é preservado). Sem --strict, service_role/postgres e funções
# SECURITY DEFINER continuam podendo escrever — o script avisa quantas existem.
# Exit: 0 ok · 1 falhou ou a conferência achou escrita ainda possível · 2 uso,
#       config ou confirmação negada.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"
MIG_TAG="freeze"

ACTION="freeze"; DRY_RUN=0; STRICT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)  DRY_RUN=1; shift ;;
    --strict)   STRICT=1; shift ;;
    --status)   ACTION="status"; shift ;;
    --unfreeze) ACTION="unfreeze"; shift ;;
    --yes)      MIG_YES=1; shift ;;
    -h|--help)  mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
  esac
done

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
mig_alias SRC_DB_URL SOURCE_DB_URL
[[ -n "${SRC_DB_URL:-}" ]] || mig_die 2 "SRC_DB_URL é obrigatório"
STATE_DIR="${FREEZE_STATE_DIR:-freeze-state}"
ROLES="${FREEZE_ROLES:-authenticated anon}"
SCHEMAS="${FREEZE_SCHEMAS:-public}"
[[ "$ROLES $SCHEMAS" =~ ^[A-Za-z0-9_\ ]+$ ]] || mig_die 2 "FREEZE_ROLES/FREEZE_SCHEMAS aceitam só nomes simples separados por espaço"
mig_need psql
TARGET="$(mig_target "$SRC_DB_URL")"

# q <args psql> — SQL por stdin, com as listas como variáveis do psql (sem interpolar no SQL)
q() { mig_psql "$SRC_DB_URL" -XAtq -v ON_ERROR_STOP=1 -v roles="$ROLES" -v schemas="$SCHEMAS" "$@"; }

# Quantas tabelas ainda aceitam escrita de papel congelado (inclui grant via PUBLIC/herança)?
writable_count() {
  q <<'SQL'
SELECT count(*) FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_roles r ON r.rolname = ANY (string_to_array(:'roles', ' '))
WHERE n.nspname = ANY (string_to_array(:'schemas', ' ')) AND c.relkind IN ('r','p')
  AND (has_table_privilege(r.oid, c.oid, 'INSERT') OR has_table_privilege(r.oid, c.oid, 'UPDATE')
    OR has_table_privilege(r.oid, c.oid, 'DELETE') OR has_table_privilege(r.oid, c.oid, 'TRUNCATE'));
SQL
}
has_cron()      { [[ "$(q -c "SELECT to_regclass('cron.job') IS NOT NULL")" == "t" ]]; }
has_alter_job() { [[ "$(q -c "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'cron' AND p.proname = 'alter_job'")" != "0" ]]; }
active_crons()  { if has_cron; then q -c "SELECT count(*) FROM cron.job WHERE active"; else echo 0; fi; }
strict_on()     { [[ "$(q -c "SELECT count(*) FROM pg_db_role_setting s JOIN pg_roles r ON r.oid = s.setrole WHERE r.rolname = 'authenticator' AND 'default_transaction_read_only=on' = ANY (s.setconfig)")" != "0" ]]; }

verify_frozen() {  # imprime o diagnóstico; retorna 1 se ainda dá para escrever
  local w c rc=0
  w="$(writable_count)"; c="$(active_crons)"
  if [[ "$w" != "0" ]]; then mig_err "✖ $w tabela(s) ainda aceitam escrita de [$ROLES] (grant via PUBLIC ou herança?)"; rc=1; fi
  if [[ "$c" != "0" ]]; then mig_err "✖ $c cron job(s) ainda ativos"; rc=1; fi
  if strict_on; then
    mig_log "✔ authenticator em default_transaction_read_only=on (--strict)"
  else
    local definer
    definer="$(q <<'SQL'
SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = ANY (string_to_array(:'schemas', ' ')) AND p.prosecdef;
SQL
)"
    mig_log "ℹ sem --strict: service_role/postgres e $definer função(ões) SECURITY DEFINER ainda podem escrever"
  fi
  return "$rc"
}

current_snapshot() { [[ -f "$STATE_DIR/CURRENT" ]] && cat "$STATE_DIR/CURRENT"; }

# ── status ────────────────────────────────────────────────────────────────
if [[ "$ACTION" == "status" ]]; then
  if snap="$(current_snapshot)"; then
    mig_log "freeze ATIVO em $TARGET — snapshot $STATE_DIR/$snap"
    verify_frozen || mig_die 1 "freeze registrado, mas a origem NÃO está congelada de fato"
    mig_log "✔ conferido: origem congelada"
  else
    mig_log "nenhum freeze registrado em $STATE_DIR"
  fi
  exit 0
fi

# ── unfreeze ──────────────────────────────────────────────────────────────
if [[ "$ACTION" == "unfreeze" ]]; then
  snap="$(current_snapshot)" || { mig_log "nenhum freeze ativo registrado em $STATE_DIR — nada a desfazer"; exit 0; }
  OUT="$STATE_DIR/$snap"
  [[ -f "$OUT/unfreeze.sql" ]] || mig_die 1 "snapshot incompleto: falta $OUT/unfreeze.sql"
  if (( DRY_RUN )); then
    mig_log "dry-run: aplicaria $OUT/unfreeze.sql em $TARGET"; exit 0
  fi
  mig_confirm "Isto REABRE a escrita na origem $TARGET (snapshot $snap)." "$TARGET"
  mig_psql "$SRC_DB_URL" -Xq -v ON_ERROR_STOP=1 -1 -f "$OUT/unfreeze.sql" >/dev/null \
    || mig_die 1 "unfreeze falhou — transação desfeita, origem continua congelada"
  mv "$STATE_DIR/CURRENT" "$OUT/UNFROZEN_AT"
  mig_ts >> "$OUT/UNFROZEN_AT"
  mig_log "✔ origem reaberta ($(writable_count) tabela(s) graváveis por [$ROLES]; $(active_crons) cron(s) ativos)"
  exit 0
fi

# ── freeze ────────────────────────────────────────────────────────────────
if snap="$(current_snapshot)"; then
  mig_log "freeze JÁ ativo (snapshot $STATE_DIR/$snap) — snapshot original preservado, nada novo foi gravado"
  verify_frozen || mig_die 1 "freeze registrado, mas a origem NÃO está congelada — rode --unfreeze e congele de novo"
  exit 0
fi

missing_roles="$(q <<'SQL'
SELECT COALESCE(string_agg(x, ' '), '') FROM unnest(string_to_array(:'roles', ' ')) x
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = x);
SQL
)" || mig_die 1 "não consegui conectar na origem ($TARGET)"
[[ -z "$missing_roles" ]] || mig_die 2 "papel(is) inexistente(s) na origem: $missing_roles"
if (( STRICT )); then
  [[ "$(q -c "SELECT count(*) FROM pg_roles WHERE rolname = 'authenticator'")" == "1" ]] \
    || mig_die 2 "--strict exige o papel authenticator (não existe nesta origem)"
fi

umask 077   # cron.command pode conter chaves; snapshot fica 600
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$STATE_DIR/$TS"
mkdir -p "$OUT"

mig_log "Snapshot de privilégios → $OUT/privileges.sql"
q > "$OUT/privileges.sql" <<'SQL'
SELECT format('GRANT %s ON TABLE %I.%I TO %I;',
              string_agg(privilege_type, ', ' ORDER BY privilege_type), table_schema, table_name, grantee)
FROM information_schema.role_table_grants
WHERE grantee = ANY (string_to_array(:'roles', ' '))
  AND table_schema = ANY (string_to_array(:'schemas', ' '))
GROUP BY table_schema, table_name, grantee
ORDER BY table_schema, table_name, grantee;
SQL
q > "$OUT/default_privileges.sql" <<'SQL'
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT %s ON TABLES TO %I;',
              n.nspname, string_agg(a.privilege_type, ', ' ORDER BY a.privilege_type), g.rolname)
FROM pg_default_acl d
JOIN pg_namespace n ON n.oid = d.defaclnamespace
CROSS JOIN LATERAL aclexplode(d.defaclacl) a
JOIN pg_roles g ON g.oid = a.grantee
WHERE d.defaclobjtype = 'r' AND d.defaclrole = (SELECT oid FROM pg_roles WHERE rolname = current_user)
  AND n.nspname = ANY (string_to_array(:'schemas', ' '))
  AND g.rolname = ANY (string_to_array(:'roles', ' '))
  AND a.privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE')
GROUP BY n.nspname, g.rolname
ORDER BY 1;
SQL

CRON_MODE="none"
if has_cron; then
  if has_alter_job; then CRON_MODE="alter"; else CRON_MODE="unschedule"; fi
  mig_log "Snapshot de crons → $OUT/cron_jobs.sql (modo $CRON_MODE)"
  if [[ "$CRON_MODE" == "alter" ]]; then
    q -c "SELECT format('SELECT cron.alter_job(%s, active := true);', jobid) FROM cron.job WHERE active ORDER BY jobid" > "$OUT/cron_jobs.sql"
  else
    q -c "SELECT format('SELECT cron.schedule(%L,%L,%L);', jobname, schedule, command) FROM cron.job ORDER BY jobid" > "$OUT/cron_jobs.sql"
  fi
else
  : > "$OUT/cron_jobs.sql"
  mig_log "AVISO: extensão pg_cron ausente na origem — nenhum job para pausar."
fi

# SQL de congelamento e de reversão (aplicados com -1: transação única)
{
  for s in $SCHEMAS; do
    echo "REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA \"$s\" FROM ${ROLES// /, };"
    echo "ALTER DEFAULT PRIVILEGES IN SCHEMA \"$s\" REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES FROM ${ROLES// /, };"
  done
  case "$CRON_MODE" in
    alter)      echo "SELECT cron.alter_job(jobid, active := false) FROM cron.job WHERE active;" ;;
    unschedule) echo "SELECT cron.unschedule(jobid) FROM cron.job;" ;;
  esac
  if (( STRICT )); then
    echo "ALTER ROLE authenticator SET default_transaction_read_only = on;"
    echo "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = 'authenticator' AND pid <> pg_backend_pid();"
  fi
} > "$OUT/freeze.sql"
{
  cat "$OUT/privileges.sql" "$OUT/default_privileges.sql" "$OUT/cron_jobs.sql"
  if (( STRICT )); then
    echo "ALTER ROLE authenticator RESET default_transaction_read_only;"
    echo "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = 'authenticator' AND pid <> pg_backend_pid();"
  fi
} > "$OUT/unfreeze.sql"

if (( DRY_RUN )); then
  mig_log "DRY-RUN — o que seria executado em $TARGET:"
  sed 's/^/    /' "$OUT/freeze.sql"
  mig_log "DRY-RUN concluído. Nada foi modificado. Snapshots em $OUT."
  exit 0
fi

mig_confirm "Isto BLOQUEIA escrita de [$ROLES] e pausa os crons em $TARGET." "$TARGET"

cat > "$OUT/UNFREEZE.md" <<EOF
# Como reverter o freeze desta janela

\`\`\`bash
./cutover/freeze-origin.sh --unfreeze        # recomendado (confere e registra)
# ou, manualmente, numa transação:
psql "\$SRC_DB_URL" -1 -v ON_ERROR_STOP=1 -f $OUT/unfreeze.sql
\`\`\`
EOF

mig_log "Congelando $TARGET (transação única)…"
mig_psql "$SRC_DB_URL" -Xq -v ON_ERROR_STOP=1 -1 -f "$OUT/freeze.sql" > "$OUT/freeze.log" 2>&1 || {
  mig_redact < "$OUT/freeze.log" | tail -n 5 >&2
  mig_die 1 "freeze falhou — transação desfeita, origem NÃO foi alterada (snapshot em $OUT)"
}
printf '%s\n' "$TS" > "$STATE_DIR/CURRENT"

verify_frozen || mig_die 1 "freeze aplicado, mas a conferência falhou — a origem ainda aceita escrita (desfaça com --unfreeze)"
mig_log "✔ Origem congelada e conferida. Snapshots + instruções em $OUT/"
