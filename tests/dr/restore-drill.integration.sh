#!/usr/bin/env bash
set -euo pipefail
umask 077
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FIXTURE_DIR=$(mktemp -d "$ROOT/.drill-test-XXXXXX")
SOURCE="singu-drill-source-$$"
TARGET="singu-drill-target-$$"
cleanup() {
  docker rm -fv "$SOURCE" "$TARGET" >/dev/null 2>&1 || true
  rm -f "$FIXTURE_DIR/backup.dump" "$FIXTURE_DIR/counts.tsv"
  rmdir "$FIXTURE_DIR"
}
trap cleanup EXIT
trap 'exit 130' INT TERM
export POSTGRES_PASSWORD="$(openssl rand -hex 32)"
READER_PASSWORD=$(openssl rand -hex 32)
DENIED_PASSWORD=$(openssl rand -hex 32)
for container in "$SOURCE" "$TARGET"; do
  docker run -d --name "$container" -e POSTGRES_PASSWORD \
    -v "$ROOT:/workspace" supabase/postgres:17.6.1.171 >/dev/null
  for attempt in {1..90}; do
    if docker exec "$container" pg_isready -h localhost -U supabase_admin -d postgres >/dev/null 2>&1; then break; fi
    sleep 1
  done
  docker exec "$container" psql -U postgres -v ON_ERROR_STOP=1 \
    -c 'CREATE DATABASE drill_fixture TEMPLATE template0' >/dev/null
done
docker exec -i "$SOURCE" psql -U supabase_admin -d drill_fixture -v ON_ERROR_STOP=1 \
  -v reader_password="$READER_PASSWORD" <<'SQL'
CREATE SCHEMA auth;
CREATE TABLE auth.users(id integer PRIMARY KEY);
CREATE TABLE public.contacts(id integer PRIMARY KEY);
CREATE TABLE public.user_roles(id integer PRIMARY KEY);
INSERT INTO auth.users VALUES (1);
INSERT INTO public.contacts VALUES (1), (2), (3);
INSERT INTO public.user_roles VALUES (1);
CREATE ROLE singu_backup_reader_test LOGIN PASSWORD :'reader_password';
GRANT USAGE ON SCHEMA public, auth TO singu_backup_reader_test;
GRANT SELECT ON ALL TABLES IN SCHEMA public, auth TO singu_backup_reader_test;
REVOKE EXECUTE ON FUNCTION pg_catalog.pg_control_system() FROM PUBLIC;
SQL
source_ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$SOURCE")
export PGPASSWORD="$READER_PASSWORD"
export PROD_DB_URL="postgresql://singu_backup_reader_test@${source_ip}:5432/drill_fixture?sslmode=disable&application_name=marker-nao-publicar"
export DRILL_DB_URL="postgresql://supabase_admin:${POSTGRES_PASSWORD}@localhost:5432/drill_fixture"
export CRITICAL_TABLES=contacts,user_roles
BACKUP_FILE="$FIXTURE_DIR/backup.dump" SOURCE_COUNTS_FILE="$FIXTURE_DIR/counts.tsv" \
  DUMP_CONTAINER="$TARGET" CONTAINER_BACKUP_FILE="/workspace/$(basename "$FIXTURE_DIR")/backup.dump" \
  node "$ROOT/scripts/migration/dr/create-drill-backup.mjs"
run_restore() {
  docker exec --user "$(id -u):$(id -g)" -e PGPASSWORD -e PROD_DB_URL -e DRILL_DB_URL -e CRITICAL_TABLES \
    -e BACKUP_FILE="/workspace/$(basename "$FIXTURE_DIR")/backup.dump" \
    -e SOURCE_COUNTS_FILE="/workspace/$(basename "$FIXTURE_DIR")/counts.tsv" \
    -w /workspace "$TARGET" bash scripts/migration/dr/restore-drill.sh
}
if output=$(run_restore); then echo 'FALHA: origem sem EXECUTE passou no preflight'; exit 1;
else test "$?" -eq 2; fi
printf '%s\n' "$output"
[[ "$output" == *'origem exige EXECUTE'* ]]
docker exec "$SOURCE" psql -U supabase_admin -d drill_fixture -v ON_ERROR_STOP=1 -c \
  'GRANT EXECUTE ON FUNCTION pg_catalog.pg_control_system() TO singu_backup_reader_test; INSERT INTO public.contacts VALUES (4)' >/dev/null
docker exec --user "$(id -u):$(id -g)" \
  -e BACKUP_FILE="/workspace/$(basename "$FIXTURE_DIR")/backup.dump" -w /workspace \
  "$TARGET" bash scripts/migration/dr/backup-encryption-check.sh
run_restore
test "$(docker exec "$SOURCE" psql -U supabase_admin -d drill_fixture -Atqc 'SELECT count(*) FROM public.contacts')" -eq 4
test "$(docker exec "$TARGET" psql -U supabase_admin -d drill_fixture -Atqc 'SELECT count(*) FROM public.contacts')" -eq 3
echo 'PASS: escrita posterior não reprova restore íntegro; snapshot=3, origem atual=4, destino=3'
saved_target="$DRILL_DB_URL"
export DRILL_DB_URL="postgresql://supabase_admin:${POSTGRES_PASSWORD}@${source_ip}:5432/drill_fixture"
if output=$(run_restore); then echo 'FALHA: restore aceitou o cluster da origem'; exit 1;
else test "$?" -eq 2; fi
printf '%s\n' "$output"
[[ "$output" == *'origem e destino precisam ser instâncias PostgreSQL distintas'* ]]
export DRILL_DB_URL="$saved_target"
docker exec -i "$TARGET" psql -U supabase_admin -d drill_fixture -v ON_ERROR_STOP=1 \
  -v denied_password="$DENIED_PASSWORD" <<'SQL'
CREATE ROLE singu_restore_denied_test LOGIN PASSWORD :'denied_password';
GRANT EXECUTE ON FUNCTION pg_catalog.pg_control_system() TO singu_restore_denied_test;
SQL
export DRILL_DB_URL="postgresql://singu_restore_denied_test:${DENIED_PASSWORD}@localhost:5432/drill_fixture"
if run_restore; then echo 'FALHA: restore sem permissão passou'; exit 1;
else test "$?" -eq 1; fi
report_dir="$ROOT/scripts/migration/dr/out"
if rg -q -- 'marker-nao-publicar|postgresql://' "$report_dir"/restore-drill-*.md || \
   rg -q -- "$POSTGRES_PASSWORD|$READER_PASSWORD|$DENIED_PASSWORD" "$report_dir"/restore-drill-*.md; then
  echo 'FALHA: conexão ou segredo no relatório'; exit 1
fi
test -z "$(find "$report_dir" -name '.pg-restore-*' -print -quit)"
rg -q 'Erros: [1-9].*permissão: [1-9]' "$report_dir"/restore-drill-*.md
echo 'PASS: origem/destino iguais e conta sem privilégios bloqueados; diagnóstico preservado sem segredos ou logs brutos'
