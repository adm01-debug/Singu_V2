#!/usr/bin/env bash
# cutover-cdc.test.sh — freeze/unfreeze da origem, CDC (drain, lag-watch,
# dry-run), chaos drill, extract-ddl (ida e volta) e senha de URL fora do argv,
# num Postgres EFÊMERO próprio (wal_level=logical + papéis estilo Supabase),
# criado com initdb em /tmp e destruído no fim. Sem initdb, pula.
# shellcheck disable=SC2016  # trechos em aspas simples são o código literal dos binários falsos
# shellcheck source-path=SCRIPTDIR source=lib/harness.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/harness.sh"
pg_eph_ok || skip_all "initdb/pg_ctl não encontrados (ou sem usuário postgres) — não dá para subir o cluster efêmero"
command -v pg_recvlogical >/dev/null 2>&1 || skip_all "pg_recvlogical ausente"
pg_eph_start || { fail "não consegui subir o cluster efêmero"; finish; }
eph_mkdb origem "$T_LIB/fixture-schema.sql" "$T_LIB/fixture-data.sql" "$T_LIB/fixture-roles.sql" || { fail "fixture da origem"; finish; }
eph_mkdb destino "$T_LIB/fixture-schema.sql" "$T_LIB/fixture-roles.sql" || { fail "fixture do destino"; finish; }
SRC="$(eph_url origem)"; DST="$(eph_url destino)"; TGT="127.0.0.1:$EPH_PORT/origem"
o() { eph -d origem -c "$1"; }
d() { eph -d destino -c "$1"; }
cd "$T_TMP" || exit 1

section "senha da URL: chega certa ao servidor e não aparece em ps"
PWURL="$(pgurl g6_pw "$T_PW_ENC" "127.0.0.1:$EPH_PORT/origem")"
run env PGPASSWORD=errada psql "postgresql://g6_pw@127.0.0.1:$EPH_PORT/origem" -XAtqc "select 1"
is "$RC" "2" "controle: senha errada é recusada (autenticação scram ativa)"
run env SRC_DB_URL="$PWURL" DEST_DB_URL="$PWURL" bash "$MIG/compare-counts.sh"
rc_is 0 "senha com @, espaço, \$ e % (percent-encoded) autentica via PGPASSWORD"
( env SRC_DB_URL="$PWURL" CDC_SLOT=nao_existe POLL_SEC=1 LAG_MAX_FAILS=1 bash -c '
    source "$0/_lib.sh"; mig_psql "$SRC_DB_URL" -XAtqc "select pg_sleep(2)"' "$MIG" >/dev/null 2>&1 & )
sleep 0.8
falsy "senha (crua ou codificada) não aparece na lista de processos" bash -c "ps -eo args | grep -v grep | grep -E 'w0rd|p%40ss'"
sleep 1.5

section "cutover/freeze-origin.sh"
FZ="$MIG/cutover/freeze-origin.sh"; export FREEZE_STATE_DIR="$T_TMP/freeze state"
o "UPDATE cron.job SET active = false WHERE jobname = 'nightly'" >/dev/null
can() { o "SELECT has_table_privilege('$1', 'public.contacts', '$2')"; }
run env SRC_DB_URL="$SRC" bash "$FZ" --dry-run
rc_is 0 "--dry-run"; has "REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES" "mostra o plano"
is "$(can authenticated INSERT)" "t" "--dry-run não revoga nada"
falsy "--dry-run não marca freeze ativo" test -e "$FREEZE_STATE_DIR/CURRENT"
run env SRC_DB_URL="$SRC" bash "$FZ"
rc_is 2 "sem confirmação não congela (antes: congelava direto)"; is "$(can authenticated INSERT)" "t" "origem intacta"
# falha no meio (pausa de cron quebra) → transação desfeita
o "ALTER FUNCTION cron.alter_job RENAME TO alter_job_ok" >/dev/null
o "CREATE FUNCTION cron.alter_job(job_id bigint, schedule text DEFAULT NULL, command text DEFAULT NULL, database text DEFAULT NULL, username text DEFAULT NULL, active boolean DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS \$f\$ BEGIN RAISE EXCEPTION 'boom'; END \$f\$" >/dev/null
run env SRC_DB_URL="$SRC" bash "$FZ" --yes
rc_is 1 "falha ao pausar cron → exit 1 (antes: '|| true' e 'congelada com sucesso')"
is "$(can authenticated INSERT)" "t" "…e o REVOKE foi desfeito (tudo ou nada)"
falsy "freeze que falhou não fica registrado" test -e "$FREEZE_STATE_DIR/CURRENT"
o "DROP FUNCTION cron.alter_job(bigint,text,text,text,text,boolean)" >/dev/null; o "ALTER FUNCTION cron.alter_job_ok RENAME TO alter_job" >/dev/null
run env SRC_DB_URL="$SRC" CONFIRM="$TGT" bash "$FZ" --strict
rc_is 0 "freeze --strict com CONFIRM=<alvo>"; has "Origem congelada e conferida" "confere depois de congelar"
is "$(can authenticated INSERT)|$(can authenticated SELECT)|$(can anon SELECT)" "f|t|t" "escrita revogada, leitura mantida"
is "$(o "SELECT count(*) FROM cron.job WHERE active")" "0" "crons pausados (não apagados)"
is "$(o "SELECT count(*) FROM cron.job")" "2" "nenhum job foi removido (antes: cron.unschedule apagava)"
run psql "postgresql://authenticator@127.0.0.1:$EPH_PORT/origem" -Xqc "SET ROLE service_role; INSERT INTO public.companies(name) VALUES ('x')"
has "read-only transaction" "--strict bloqueia até service_role via authenticator"
is "$(stat -c %a "$FREEZE_STATE_DIR"/*/cron_jobs.sql | sort -u)" "600" "snapshot (pode conter chaves de cron) é 600"
SNAPS="$(find "$FREEZE_STATE_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l)"
run env SRC_DB_URL="$SRC" bash "$FZ" --yes
rc_is 0 "freeze 2x é idempotente"; has "freeze JÁ ativo" "avisa que já estava congelado"
is "$(find "$FREEZE_STATE_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l)" "$SNAPS" "2ª execução NÃO cria snapshot vazio por cima do original (antes: criava)"
run env SRC_DB_URL="$SRC" bash "$FZ" --status; rc_is 0 "--status confirma"; has "origem congelada" ""
o "GRANT INSERT ON public.error_logs TO PUBLIC" >/dev/null
run env SRC_DB_URL="$SRC" bash "$FZ" --status
rc_is 1 "--status detecta escrita reaberta por grant via PUBLIC"
o "REVOKE INSERT ON public.error_logs FROM PUBLIC" >/dev/null
run env SRC_DB_URL="$SRC" bash "$FZ" --unfreeze; rc_is 2 "--unfreeze também exige confirmação"
run env SRC_DB_URL="$SRC" bash "$FZ" --unfreeze --yes
rc_is 0 "--unfreeze"
is "$(can authenticated INSERT)|$(can authenticated TRUNCATE)|$(can anon INSERT)" "t|f|f" "privilégios voltam EXATAMENTE ao que eram"
is "$(o "SELECT string_agg(jobname || '=' || active, ',' ORDER BY jobname) FROM cron.job")" "it's; odd=true,nightly=false" "só o cron que estava ativo é reativado (antes: todos voltavam ativos)"
o "CREATE TABLE public.nova_pos_freeze (id int)" >/dev/null
is "$(o "SELECT has_table_privilege('authenticated', 'public.nova_pos_freeze', 'INSERT')")" "t" "privilégios padrão restaurados (antes: revogados para sempre)"
o "DROP TABLE public.nova_pos_freeze" >/dev/null
run psql "postgresql://authenticator@127.0.0.1:$EPH_PORT/origem" -Xqc "SET ROLE service_role; INSERT INTO public.companies(name) VALUES ('pos-unfreeze')"
rc_is 0 "escrita via API volta após o unfreeze"
o "DELETE FROM public.companies WHERE name = 'pos-unfreeze'" >/dev/null
run env SRC_DB_URL="$SRC" bash "$FZ" --unfreeze --yes; rc_is 0 "--unfreeze 2x é idempotente"; has "nada a desfazer" ""
run env SRC_DB_URL="$SRC" FREEZE_ROLES="x; DROP" bash "$FZ" --dry-run; rc_is 2 "FREEZE_ROLES com SQL é recusado"
run env SRC_DB_URL="$SRC" FREEZE_ROLES="papel_inexistente" bash "$FZ" --dry-run; rc_is 2 "papel inexistente"

section "cdc/checkpoint.sql + drain.sh + lag-watch.sh"
run eph -d destino -f "$MIG/cdc/checkpoint.sql"; rc_is 0 "checkpoint.sql 1ª vez"
run eph -d destino -f "$MIG/cdc/checkpoint.sql"; rc_is 0 "checkpoint.sql 2ª vez (antes: 'policy already exists')"
export CDC_OUT_DIR="$T_TMP/cdc out"
run env SRC_DB_URL="$SRC" bash "$MIG/cdc/lag-watch.sh" --once; rc_is 2 "lag-watch: slot inexistente"
run env SRC_DB_URL="$SRC" bash "$MIG/cdc/drain.sh"; rc_is 2 "drain: slot inexistente (erro claro, não loop)"
o "SELECT pg_create_logical_replication_slot('migration_slot', 'test_decoding')" >/dev/null
run env SRC_DB_URL="$SRC" bash "$MIG/cdc/drain.sh"; rc_is 2 "drain: plugin do slot ≠ esperado (wal2json)"
run env SRC_DB_URL="$SRC" CDC_PLUGIN=test_decoding bash "$MIG/cdc/drain.sh" --dry-run; rc_is 0 "drain --dry-run"
run env SRC_DB_URL="$SRC" bash "$MIG/cdc/lag-watch.sh" --once
rc_is 0 "lag-watch --once com slot ok (antes: SQL inválido → sempre 'SLOT NÃO ENCONTRADO')"; has "slot=migration_slot active=false lag_bytes=" "mede o lag"
run env SRC_DB_URL="$SRC" CDC_SLOT="x' OR '1'='1" bash "$MIG/cdc/lag-watch.sh" --once; rc_is 2 "nome de slot com SQL é recusado"
o "INSERT INTO public.companies(name) SELECT 'cdc-' || g FROM generate_series(1, 200) g" >/dev/null
run env SRC_DB_URL="$SRC" LAG_MAX_BYTES=10 bash "$MIG/cdc/lag-watch.sh" --once; rc_is 1 "lag acima do limite → exit 1"; has "lag_bytes > 10" ""
run env SRC_DB_URL="postgresql://postgres@127.0.0.1:1/x" bash "$MIG/cdc/lag-watch.sh" --once
rc_is 2 "origem inacessível ≠ 'slot não encontrado'"; has "origem inacessível" ""
# laço: lag_sec cresce com o slot parado, AUTO_DRAIN sobe UM drain, Ctrl+C sai limpo
run env SRC_DB_URL="$SRC" LAG_MAX_SEC=1 POLL_SEC=1 AUTO_DRAIN=1 CDC_PLUGIN=test_decoding python3 "$T_LIB/sigrun.py" 6 INT bash "$MIG/cdc/lag-watch.sh"
rc_is 0 "Ctrl+C no lag-watch encerra limpo"
has "lag_sec > 1" "detecta slot parado com WAL pendente"; has "active=true" "AUTO_DRAIN reanimou o drain"
is "$(grep -c 'AUTO_DRAIN — slot sem consumidor' <<<"$OUT")" "1" "dispara um único drain (antes: um por ciclo)"
truthy "drain de emergência gravou o WAL" bash -c "grep -q 'cdc-200' '$CDC_OUT_DIR'/wal-*.json"
is "$(stat -c %a "$CDC_OUT_DIR"/wal-*.json | sort -u)" "600" "arquivo de WAL é 600"
sleep 1
o "INSERT INTO public.companies(name) VALUES ('cdc-sigint')" >/dev/null
run env SRC_DB_URL="$SRC" CDC_PLUGIN=test_decoding python3 "$T_LIB/sigrun.py" 3 INT bash "$MIG/cdc/drain.sh"
rc_is 0 "Ctrl+C no drain encerra limpo"
o "DELETE FROM public.companies WHERE name LIKE 'cdc-%'" >/dev/null

section "chaos/inject.sh"
CH=(env SRC_DB_URL="$SRC" DEST_DB_URL="$DST" bash "$MIG/chaos/inject.sh")
run env STAGING_CONFIRM=0 SCENARIO=dns-stale "${CH[@]:1}"; rc_is 2 "STAGING_CONFIRM=0 é recusado (antes: qualquer valor não vazio passava)"
run env SCENARIO=dns-stale "${CH[@]:1}"; rc_is 2 "sem STAGING_CONFIRM"
export STAGING_CONFIRM=1
run env SCENARIO=dns-stale SRC_DB_URL="$SRC" DEST_DB_URL="$(pgurl postgres x db.pgxfvjmuubtbowutlide.supabase.co:5432/postgres)" bash "$MIG/chaos/inject.sh"
rc_is 2 "URL com o ref de PRODUÇÃO do repo é recusada"; has "RECUSADO" ""
run env SCENARIO=dns-stale PROD_REFS="destino" "${CH[@]:1}"; rc_is 2 "PROD_REFS adicional"
run env SCENARIO=nao-existe "${CH[@]:1}"; rc_is 2 "cenário desconhecido"
run env SCENARIO=corrupt-checkpoint "${CH[@]:1}"; rc_is 0 "corrupt-checkpoint"
run env SCENARIO=corrupt-checkpoint "${CH[@]:1}"; rc_is 0 "corrupt-checkpoint 2x (idempotente)"
is "$(d "SELECT count(*) FROM public._migration_cdc_checkpoint WHERE lsn = 'CHAOS/BADLSN'")" "1" "um único LSN inválido"
run env SCENARIO=revoke-grant DRY_RUN=1 "${CH[@]:1}"; rc_is 0 "revoke-grant em dry-run"
is "$(d "SELECT has_table_privilege('authenticated', 'public.contacts', 'SELECT')")" "t" "dry-run não revoga"
env SCENARIO=revoke-grant CHAOS_REVOKE_SEC=2 "${CH[@]:1}" >/dev/null 2>&1 </dev/null
is "$(d "SELECT has_table_privilege('authenticated', 'public.contacts', 'SELECT')")" "f" "revoke-grant revoga"
sleep 3.5
is "$(d "SELECT has_table_privilege('authenticated', 'public.contacts', 'SELECT')")" "t" "…e devolve sozinho após o prazo"
cat > "$T_FAKE/pg_recvlogical" <<'FEOF'
#!/usr/bin/env bash
# drain de mentira: fica vivo com o argv de um pg_recvlogical real
trap 'kill "$c" 2>/dev/null; exit 0' TERM
sleep 60 & c=$!
wait "$c"
FEOF
chmod +x "$T_FAKE/pg_recvlogical"
"$T_FAKE/pg_recvlogical" -d x --slot outro_slot --start & P_OUTRO=$!; "$T_FAKE/pg_recvlogical" -d x --slot migration_slot --start & P_ALVO=$!
T_PIDS+=("$P_OUTRO" "$P_ALVO"); sleep 0.3
run env SCENARIO=slot-full "${CH[@]:1}"
is "$(ps -o stat= -p "$P_ALVO" | cut -c1)$(ps -o stat= -p "$P_OUTRO" | cut -c1)" "TS" "slot-full pausa só o drain do slot alvo"
run env SCENARIO=resume-drain "${CH[@]:1}"; is "$(ps -o stat= -p "$P_ALVO" | cut -c1)" "S" "resume-drain retoma"
run env SCENARIO=kill-drain "${CH[@]:1}"; sleep 0.3
falsy "kill-drain mata o drain do slot alvo" kill -0 "$P_ALVO"
truthy "…e não toca no drain de outro slot" kill -0 "$P_OUTRO"
unset STAGING_CONFIRM

section "cdc/dry-run.sh (pg_recvlogical real + replay.ts emulado por deno falso)"
fake_bin deno '
if [[ ! -f "$CDC_OUT_DIR/.replayed" ]]; then
  psql "$FAKE_SRC" -XAtqc "COPY (SELECT * FROM public._cdc_dryrun_canary) TO STDOUT" | psql "$FAKE_DEST" -Xqc "COPY public._cdc_dryrun_canary FROM STDIN"
  [[ -n "${FAKE_NO_CKPT:-}" ]] || psql "$FAKE_DEST" -Xqc "INSERT INTO public._migration_cdc_checkpoint(lsn) VALUES (clock_timestamp()::text)"
  touch "$CDC_OUT_DIR/.replayed"; echo "total=48 applied=48 skipped=0 dry=[${DRY_RUN:-}]"
else echo "total=48 ${FAKE_APPLIED2-applied=0} skipped=48"; fi
exit "${FAKE_DENO_EXIT:-0}"'
rm -f "$T_FAKE/pg_recvlogical"
dry() {  # dry <env extra...> — roda o ensaio com saída própria
  CDC_OUT_DIR="$(mktemp -d "$T_TMP/dryXXXX")"; export CDC_OUT_DIR
  run env SRC_DB_URL="$SRC" DEST_DB_URL="$DST" DEST_SUPABASE_URL=http://127.0.0.1:9 DEST_SERVICE_ROLE_KEY=chaveSEGREDO \
    FAKE_SRC="$SRC" FAKE_DEST="$DST" CDC_PLUGIN=test_decoding CDC_DRY_RUN_SEC=2 SYNTHETIC_WRITES=1 DRY_RUN=1 \
    REPORT_FILE="$CDC_OUT_DIR/rep.md" PATH="$T_FAKE:$PATH" "$@" bash "$MIG/cdc/dry-run.sh"
}
leftovers() { echo "$(o "SELECT count(*) FROM pg_replication_slots WHERE slot_name = 'migration_slot_dryrun'")|$(o "SELECT to_regclass('public._cdc_dryrun_canary') IS NULL")|$(d "SELECT to_regclass('public._cdc_dryrun_canary') IS NULL")"; }
dry
rc_is 0 "ensaio completo passa"; has "Dry-run concluído com sucesso" ""
is "$(grep -c '^- \[x\]' "$CDC_OUT_DIR/rep.md")" "4" "os 4 gates marcados no relatório"
has "dry=[0]" "replay roda com DRY_RUN=0 mesmo que o ambiente traga DRY_RUN=1"
hasnt "chaveSEGREDO" "service role key não aparece na saída"
falsy "…nem no relatório/logs" grep -rq "chaveSEGREDO" "$CDC_OUT_DIR" "$FAKE_LOG"
is "$(leftovers)" "0|t|t" "slot do ensaio e tabelas canário removidos ao final"
dry FAKE_DENO_EXIT=3
rc_is 3 "replay falha → ensaio falha"; is "$(leftovers)" "0|t|t" "…e o slot NÃO fica esquecido retendo WAL (antes: ficava)"
dry FAKE_APPLIED2="applied=5"; rc_is 1 "2ª passada aplicou algo → idempotência quebrada"
dry FAKE_APPLIED2=""; rc_is 1 "replay sem 'applied=' não prova idempotência (antes: passava no vazio)"
dry FAKE_NO_CKPT=1
rc_is 1 "checkpoint não avançou com WAL capturado → gate reprova (antes: script saía 0)"; has "gate(s) falharam" ""
dry CDC_PLUGIN=wal2json; rc_is 1 "plugin indisponível na origem → erro claro"; has "não consegui criar o slot com o plugin 'wal2json'" ""
o "SELECT pg_create_logical_replication_slot('migration_slot_dryrun', 'test_decoding')" >/dev/null
dry; rc_is 0 "reusa slot pré-existente"
is "$(o "SELECT count(*) FROM pg_replication_slots WHERE slot_name = 'migration_slot_dryrun'")" "1" "…e não dropa slot que não criou"
o "SELECT pg_drop_replication_slot('migration_slot_dryrun')" >/dev/null
CDC_OUT_DIR="$(mktemp -d "$T_TMP/dryXXXX")"; export CDC_OUT_DIR
run env SRC_DB_URL="$SRC" DEST_DB_URL="$DST" DEST_SUPABASE_URL=http://127.0.0.1:9 DEST_SERVICE_ROLE_KEY=k FAKE_SRC="$SRC" FAKE_DEST="$DST" \
  CDC_PLUGIN=test_decoding CDC_DRY_RUN_SEC=40 SYNTHETIC_WRITES=1 REPORT_FILE="$CDC_OUT_DIR/rep.md" PATH="$T_FAKE:$PATH" \
  python3 "$T_LIB/sigrun.py" 4 INT bash "$MIG/cdc/dry-run.sh"
rc_is 130 "Ctrl+C no meio do ensaio → 130"
is "$(leftovers)" "0|t|t" "Ctrl+C também limpa slot e canário"
falsy "nenhum pg_recvlogical do ensaio fica órfão" pgrep -f "pg_recvlogical.*migration_slot_dryrun"
run env SRC_DB_URL="$(pga_url postgres 2>/dev/null || echo "$SRC")" DEST_DB_URL="$DST" DEST_SUPABASE_URL=x DEST_SERVICE_ROLE_KEY=k CDC_SLOT="a'b" PATH="$T_FAKE:$PATH" bash "$MIG/cdc/dry-run.sh"
rc_is 2 "CDC_SLOT inválido é recusado antes de qualquer SQL"

section "extract-ddl.sh (extrai → aplica em banco novo → extrai de novo)"
o "COMMENT ON TABLE public.contacts IS 'it''s'; COMMENT ON COLUMN public.contacts.name IS 'nome; -- x'" >/dev/null
o "CREATE DOMAIN public.posint AS int CHECK (VALUE > 0); CREATE VIEW public.a_dep AS SELECT * FROM public.v_open_deals; CREATE TABLE public.gen (a int, b int GENERATED ALWAYS AS (a * 2) STORED, c3 text, c4 text, c5 text, c6 text, c7 text, c8 text, c9 text, c10 text, c11 text)" >/dev/null
X1="$T_TMP/ddl 1"; X2="$T_TMP/ddl2"
run env DDL_OUT_DIR="$X1" PGHOST=127.0.0.1 PGPORT="$EPH_PORT" PGUSER=postgres PGDATABASE=origem bash "$MIG/extract-ddl.sh"
rc_is 0 "extração (tabela com espaço no nome; antes: 'relation public.order does not exist')"
truthy "gera os 14 arquivos" bash -c "[[ \$(ls '$X1'/*.sql | wc -l) -eq 14 ]]"
truthy "CREATE SEQUENCE das colunas serial (antes: ausente → 02 não aplicava)" grep -q 'CREATE SEQUENCE IF NOT EXISTS public.companies_id_seq' "$X1/02_tables.sql"
truthy "coluna IDENTITY preservada" grep -q 'id integer GENERATED BY DEFAULT AS IDENTITY NOT NULL' "$X1/02_tables.sql"
truthy "coluna gerada preservada" grep -q 'b integer GENERATED ALWAYS AS ((a \* 2)) STORED' "$X1/02_tables.sql"
is "$(awk '/^CREATE TABLE public.gen /,/^\);/' "$X1/02_tables.sql" | grep -oE '^  (a|b|c[0-9]+) ' | tr -d ' \n')" "abc3c4c5c6c7c8c9c10c11" "colunas na ordem real com 10+ colunas (antes: ordem textual 1,10,11,2…)"
truthy "CHECK de domínio preservado" grep -q 'CREATE DOMAIN public.posint AS integer CONSTRAINT posint_check CHECK' "$X1/01_schemas_and_enums.sql"
is "$(grep -n 'VIEW public\.' "$X1/10_views.sql" | head -n 1 | grep -c v_open_deals)" "1" "views em ordem de dependência (antes: alfabética)"
falsy "saída padrão do repositório não foi tocada" bash -c "cd '$REPO' && git status --porcelain scripts/migration/ddl/*.sql | grep -q ."
eph_mkdb novo || fail "criar banco novo"
eph -d novo -c "CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE SCHEMA cron; CREATE TABLE auth.users (id uuid PRIMARY KEY)" >/dev/null
run bash -c "cd '$X1' && psql -h 127.0.0.1 -p $EPH_PORT -U postgres -d novo -X -q -v ON_ERROR_STOP=1 -f 99_apply_all.sql"
rc_is 0 "o DDL extraído aplica limpo num banco novo"
run env -u PGHOST -u PGDATABASE DDL_OUT_DIR="$X2" SRC_DB_URL="$(eph_url novo)" HOME="$T_TMP" bash "$MIG/extract-ddl.sh"
rc_is 0 "extração via SRC_DB_URL (sem PG*)"
difs=""
for f in "$X1"/*.sql; do
  b="$(basename "$f")"; [[ "$b" == 12_cron_jobs.sql ]] && continue
  diff -q <(grep -v '^-- Gerado\|^-- Fonte' "$f") <(grep -v '^-- Gerado\|^-- Fonte' "$X2/$b") >/dev/null || difs+="$b "
done
is "$difs" "" "ponto fixo: reextrair do banco recriado dá o mesmo DDL"
cp -r "$X1" "$T_TMP/ddl-antes"
run env DDL_OUT_DIR="$X1" PGHOST=127.0.0.1 PGPORT=1 PGUSER=postgres PGDATABASE=x bash "$MIG/extract-ddl.sh"
rc_is 1 "origem inacessível"; truthy "falha NÃO altera o pacote DDL existente (antes: ficava pela metade)" diff -rq "$X1" "$T_TMP/ddl-antes"
finish
