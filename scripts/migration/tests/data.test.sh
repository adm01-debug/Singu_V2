#!/usr/bin/env bash
# data.test.sh — fluxo de dados ponta a ponta em dois bancos descartáveis:
# table-order → export → import (serial e paralelo) → compare-counts, mais
# identities, unmark/rollback, dashboard e verify-extensions.
# Precisa de Postgres (PGHOST/PGPORT/PGUSER); sem ele, pula.
# shellcheck source-path=SCRIPTDIR source=lib/harness.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/harness.sh"
pg_main_ok || skip_all "sem Postgres acessível em ${PGA_HOST}:${PGA_PORT:-5432/55432} (defina PGHOST/PGPORT/PGUSER)"

ORI="$(pg_mkdb origem "$T_LIB/fixture-schema.sql" "$T_LIB/fixture-data.sql")" || { fail "não criei o banco de origem"; finish; }
DES="$(pg_mkdb destino "$T_LIB/fixture-schema.sql")" || { fail "não criei o banco de destino"; finish; }
# senha fictícia na URL (cluster em trust ignora): prova que ela não vaza em saída/arquivo
SRC="postgresql://${PGA_USER}:SenhaSECRETA%40123@${PGA_HOST}:${PGA_PORT}/${ORI}"
DST="postgresql://${PGA_USER}:SenhaSECRETA%40123@${PGA_HOST}:${PGA_PORT}/${DES}"
TGT="${PGA_HOST}:${PGA_PORT}/${DES}"
D="$T_TMP/dados com espaço"
cnt() { pga -d "$1" -c "SELECT count(*) FROM $2"; }
cd "$T_TMP" || exit 1

section "table-order.sql"
run pga -d "$ORI" -f "$MIG/table-order.sql"
rc_is 0 "roda limpo"
is "$(grep -c . <<<"$OUT")" "16" "uma linha por tabela (partições fora)"
is "$(awk -F '\t' 'NF != 2' <<<"$OUT" | wc -l | tr -d ' ')" "0" "formato padrão NN<TAB>tabela (2 colunas)"
run pga -d "$ORI" -v with_depth=1 -f "$MIG/table-order.sql"
is "$(awk -F '\t' '$2 == "companies" {print $3}' <<<"$OUT")" "0" "tabela sem FK na camada 0"
is "$(awk -F '\t' '$2 == "interactions" {print $3}' <<<"$OUT")" "3" "interactions depois de deals (camada 3)"
is "$(awk -F '\t' '$2 ~ /^cycle_/ {print $3}' <<<"$OUT" | sort -u)" "999" "ciclo mútuo vai para o fim (999)"
pos() { awk -F '\t' -v t="$1" '$2 == t {print NR}' <<<"$OUT"; }
is "$(( $(pos contacts) < $(pos deals) && $(pos deals) < $(pos interactions) ))" 1 "pai sempre antes do filho"

section "export-data.sh"
run env SRC_DB_URL="$SRC" DATA_DIR="$D" bash "$MIG/export-data.sh" --dry-run
rc_is 0 "--dry-run"
falsy "--dry-run não grava CSV" bash -c "ls '$D'/*.csv.gz"
run env SRC_DB_URL="$SRC" DATA_DIR="$D" bash "$MIG/export-data.sh"
rc_is 0 "export completo"
hasnt "SenhaSECRETA" "senha da URL não aparece na saída"
has "snapshot compartilhado" "todas as tabelas no mesmo snapshot"
has "[skip-list] login_attempts" "skip-list respeitada"
M="$D/_manifest.tsv"
is "$(awk -F '\t' '$2 == "contacts" {print $3}' "$M")" "4" "contagem exata com campo multilinha (antes: 5)"
is "$(awk -F '\t' 'NR > 1 {print $1}' "$M" | sort -c 2>&1)" "" "manifesto em ordem determinística"
is "$(awk -F '\t' '$2 == "Order Items" {print $5}' "$M")" 'id,deal_id,"Qty"' "manifesto traz as colunas (com aspas quando preciso)"
is "$(stat -c %a "$D/010_contacts.csv.gz")" "600" "CSV com permissão 600"
falsy "nenhum arquivo .partial sobra" bash -c "ls '$D'/*.partial"
falsy "senha não foi gravada em nenhum arquivo" grep -rq "SenhaSECRETA" "$D"
run env SOURCE_DB_URL="$SRC" DATA_DIR="$T_TMP/alias" bash "$MIG/export-data.sh" --only companies
rc_is 0 "nome legado SOURCE_DB_URL + --only"
is "$(awk 'END {print NR - 1}' "$T_TMP/alias/_manifest.tsv")" "1" "--only exporta 1 tabela"
run env SRC_DB_URL="$SRC" DATA_DIR="$T_TMP/x" bash "$MIG/export-data.sh" --only nao_existe
rc_is 2 "--only com tabela inexistente é erro"
run env SRC_DB_URL="$SRC" SOURCE_DB_URL="postgresql://outro@h/d" bash "$MIG/export-data.sh" --dry-run
rc_is 2 "SRC_DB_URL e SOURCE_DB_URL divergentes abortam"
run env -u SRC_DB_URL HOME="$T_TMP" bash "$MIG/export-data.sh"
rc_is 2 "sem SRC_DB_URL: erro de configuração"
# falha parcial: papel sem SELECT em uma tabela
pga -d "$ORI" -c "DROP ROLE IF EXISTS g6t_ro_$$" -c "CREATE ROLE g6t_ro_$$ LOGIN" \
  -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO g6t_ro_$$" -c "REVOKE SELECT ON public.deals FROM g6t_ro_$$" >/dev/null 2>&1
run env SRC_DB_URL="postgresql://g6t_ro_$$@${PGA_HOST}:${PGA_PORT}/${ORI}" DATA_DIR="$T_TMP/parcial" bash "$MIG/export-data.sh"
rc_is 1 "uma tabela falhou → exit 1 (antes: 0)"
falsy "export incompleto NÃO grava manifesto" test -e "$T_TMP/parcial/_manifest.tsv"
has "FALHA em deals" "diz qual tabela falhou"
pga -d "$ORI" -c "GRANT SELECT ON public.deals TO g6t_ro_$$" >/dev/null
run env SRC_DB_URL="postgresql://g6t_ro_$$@${PGA_HOST}:${PGA_PORT}/${ORI}" DATA_DIR="$T_TMP/parcial" bash "$MIG/export-data.sh" --resume
rc_is 0 "--resume completa o que faltou"
has "[resume] companies" "--resume pula o que já existia"
is "$(awk 'END {print NR - 1}' "$T_TMP/parcial/_manifest.tsv")" "11" "manifesto do --resume lista TODAS as tabelas"
pga -d "$ORI" -c "REVOKE ALL ON ALL TABLES IN SCHEMA public FROM g6t_ro_$$" -c "DROP ROLE g6t_ro_$$" >/dev/null
# regressão: última linha da skip-list sem \n era ignorada
KIT="$T_TMP/kit"; mkdir -p "$KIT"; cp "$MIG"/{_lib.sh,export-data.sh,compare-counts.sh,table-order.sql} "$KIT/"
printf 'audit_log\ncompanies' > "$KIT/skip-tables.txt"
run env SRC_DB_URL="$SRC" DATA_DIR="$T_TMP/kitdata" bash "$KIT/export-data.sh" --dry-run
has "[skip-list] companies" "última linha da skip-list sem quebra de linha é respeitada"

section "import-data.sh"
run env DEST_DB_URL="$DST" DATA_DIR="$D" bash "$MIG/import-data.sh"
rc_is 2 "sem confirmação não importa"
is "$(cnt "$DES" public.contacts)" "0" "destino intacto sem confirmação"
run env DEST_DB_URL="$DST" DATA_DIR="$D" bash "$MIG/import-data.sh" --dry-run
rc_is 0 "--dry-run"
is "$(cnt "$DES" public.contacts)" "0" "--dry-run não grava"
run env DEST_DB_URL="$DST" DATA_DIR="$D" CONFIRM="outro-alvo" bash "$MIG/import-data.sh"
rc_is 2 "CONFIRM de outro alvo é recusado"
run env DEST_DB_URL="$DST" DATA_DIR="$D" CONFIRM="$TGT" bash "$MIG/import-data.sh"
rc_is 0 "import real com CONFIRM=<alvo> (pasta com espaço, tabela com espaço)"
hasnt "SenhaSECRETA" "senha não aparece na saída"
same() { is "$(pga -d "$DES" -c "$1")" "$(pga -d "$ORI" -c "$1")" "$2"; }
same "SELECT md5(string_agg(id::text || name || coalesce(notes,'∅') || coalesce(meta::text,'∅'), '|' ORDER BY id)) FROM public.contacts" "contacts idêntica (aspas, vírgula, quebra de linha, unicode, NULL)"
same 'SELECT sum("Qty") FROM public."Order Items"' "tabela com nome entre aspas carregada"
is "$(pga -d "$DES" -c "SELECT last_value || '|' || is_called FROM public.deals_id_seq")" "7|true" "sequence de coluna IDENTITY realinhada (antes: 1|false)"
is "$(pga -d "$DES" -c "SELECT last_value FROM public.companies_id_seq")" "5" "sequence serial realinhada"
run pga -d "$DES" -c "INSERT INTO public.deals (contact_id) VALUES ('10000000-0000-0000-0000-000000000001') RETURNING id"
is "$OUT" "8" "insert pós-import não colide com id existente"
pga -d "$DES" -c "DELETE FROM public.deals WHERE id = 8" >/dev/null
run env DEST_DB_URL="$DST" DATA_DIR="$D" bash "$MIG/import-data.sh" --yes
rc_is 1 "reexecutar sem --truncate falha (chave duplicada)"
is "$(cnt "$DES" public.contacts)" "4" "…e desfaz tudo (transação única)"
run env DEST_DB_URL="$DST" DATA_DIR="$D" bash "$MIG/import-data.sh" --yes --truncate
rc_is 0 "--truncate permite reimportar (idempotente)"
is "$(cnt "$DES" public.cycle_a)|$(cnt "$DES" public.cycle_b)" "1|1" "--truncate não esvazia tabela em ciclo já carregada (antes: cycle_a=0)"
run env DEST_DB_URL="$DST" DATA_DIR="$D" bash "$MIG/import-data.sh" --yes --only contacts --truncate
rc_is 1 "--only contacts --truncate é recusado (há dependentes)"
is "$(cnt "$DES" public.deals)" "7" "…e NÃO apaga deals em cascata (antes: 0)"
run env DEST_DB_URL="$DST" DATA_DIR="$D" bash "$MIG/import-data.sh" --yes --only nao_existe
rc_is 2 "--only sem CSV correspondente é erro"
BAD="$T_TMP/ruim"; cp -r "$D" "$BAD"
printf '"id","contact_id","stage","amount"\n' | gzip > "$BAD/011_deals.csv.gz"
run env DEST_DB_URL="$DST" DATA_DIR="$BAD" bash "$MIG/import-data.sh" --yes --truncate
rc_is 1 "CSV truncado (0 linhas, manifesto diz 7) é detectado"
has "export tem 7 linha(s), carga inseriu 0" "mensagem aponta a tabela e as contagens"
is "$(cnt "$DES" public.deals)" "7" "falha no meio → rollback total, dados anteriores intactos"
echo "lixo,x" | gzip > "$BAD/011_deals.csv.gz"
run env DEST_DB_URL="$DST" DATA_DIR="$BAD" bash "$MIG/import-data.sh" --yes --truncate
rc_is 1 "cabeçalho do CSV diferente das colunas é recusado"
run env -u DEST_DB_URL TARGET_DB_URL="$DST" DATA_DIR="$T_TMP/vazio-nao-existe" bash "$MIG/import-data.sh" --yes
rc_is 2 "DATA_DIR inexistente: erro de configuração"

section "compare-counts.sh"
run env SRC_DB_URL="$SRC" DEST_DB_URL="$DST" bash "$MIG/compare-counts.sh"
rc_is 0 "contagem exata: origem × destino compatíveis"
has "[skip-list]" "tabela da skip-list com diferença só avisa"
hasnt "SenhaSECRETA" "senha não aparece"
hasnt $'\033' "sem códigos de cor fora de terminal"
run env SOURCE_DB_URL="$SRC" TARGET_DB_URL="$DST" bash "$MIG/compare-counts.sh"
rc_is 0 "nomes legados SOURCE_/TARGET_DB_URL"
pga -d "$DES" -c "DELETE FROM public.interactions WHERE id = 7" -c "CREATE TABLE public.so_no_destino (id int)" >/dev/null
run env SRC_DB_URL="$SRC" DEST_DB_URL="$DST" bash "$MIG/compare-counts.sh"
rc_is 1 "1 linha a menos reprova"
has "ausente em origem" "tabela que só existe de um lado é apontada"
has "divergência em 2 tabela(s)" "conta as divergentes"
pga -d "$DES" -c "DROP TABLE public.so_no_destino" >/dev/null
run env SRC_DB_URL="$SRC" DEST_DB_URL="$DST" bash "$MIG/compare-counts.sh" --estimate
has "modo --estimate" "--estimate avisa que usa estatística"
run env SRC_DB_URL="$SRC" DEST_DB_URL="postgresql://${PGA_USER}@127.0.0.1:1/x" bash "$MIG/compare-counts.sh"
rc_is 2 "destino inacessível é erro (2), não 'divergência'"

section "import-data-parallel.sh"
run env DEST_DB_URL="$DST" DATA_DIR="$D" bash "$MIG/import-data-parallel.sh" --dry-run
rc_is 0 "--dry-run mostra camadas"
has "camada 0: categories companies profiles user_roles" "camadas vêm do export (_order.tsv)"
run env DEST_DB_URL="$DST" DATA_DIR="$D" bash "$MIG/import-data-parallel.sh"
rc_is 2 "sem confirmação não importa"
run env DEST_DB_URL="$DST" DATA_DIR="$D" PARALLEL=3 bash "$MIG/import-data-parallel.sh" --yes --truncate
rc_is 0 "import paralelo real (antes: exit 126, caía em import-data.sh sem permissão)"
run env SRC_DB_URL="$SRC" DEST_DB_URL="$DST" bash "$MIG/compare-counts.sh"
rc_is 0 "compare-counts verde após import paralelo"
is "$(pga -d "$DES" -c "SELECT last_value || '|' || is_called FROM public.deals_id_seq")" "7|true" "sequences realinhadas no paralelo"
run env DEST_DB_URL="$DST" DATA_DIR="$BAD" bash "$MIG/import-data-parallel.sh" --yes --truncate
rc_is 1 "um job falha → script sai 1 (antes: imprimia ✖ e saía 0)"
has "falha na camada 2: deals" "diz a camada e a tabela"
is "$(cnt "$DES" 'public."Order Items"')" "0" "camadas seguintes NÃO são carregadas após a falha"
run env DEST_DB_URL="$DST" DATA_DIR="./data-out-inexistente" bash "$MIG/import-data-parallel.sh" --dry-run
rc_is 2 "DATA_DIR inexistente e sem export padrão: erro claro"
LEG="$T_TMP/legado"; mkdir -p "$LEG"
pga -d "$ORI" -c "\\copy public.companies TO '$LEG/companies.csv' WITH CSV HEADER" >/dev/null
pga -d "$DES" -c "TRUNCATE public.companies CASCADE" >/dev/null 2>&1
run env DEST_DB_URL="$DST" DATA_DIR="$LEG" bash "$MIG/import-data-parallel.sh" --yes
rc_is 0 "formato legado <tabela>.csv (sem manifesto) ainda funciona"
is "$(cnt "$DES" public.companies)" "5" "…e carrega as linhas"
run env DEST_DB_URL="$DST" DATA_DIR="$D" bash "$MIG/import-data-parallel.sh" --yes --truncate
rc_is 0 "estado final restaurado"

section "auth/export-identities.sh + import-identities.sh"
mkdir -p "$T_TMP/id dir" && cd "$T_TMP/id dir" || exit 1
run env SRC_DB_URL="$SRC" bash "$MIG/auth/export-identities.sh"
rc_is 0 "export"
has "exportadas 3 identities" "conta registros (não linhas: JSON multilinha)"
is "$(stat -c %a auth-identities.csv)" "600" "CSV de identities com permissão 600"
cp auth-identities.csv antes.csv
run env SRC_DB_URL="postgresql://${PGA_USER}@127.0.0.1:1/x" bash "$MIG/auth/export-identities.sh"
rc_is 1 "falha de conexão no export"
truthy "export que falha NÃO trunca o arquivo anterior (antes: ficava vazio)" cmp -s auth-identities.csv antes.csv
run env DEST_DB_URL="$DST" bash "$MIG/auth/import-identities.sh" --yes
rc_is 1 "identities sem usuário no destino abortam (antes: '✔ Import concluído', exit 0)"
has "sem usuario correspondente" "mensagem explica"
pga -d "$DES" -c "INSERT INTO auth.users (id, email, raw_user_meta_data) SELECT id, email, raw_user_meta_data FROM (VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'ana@exemplo.test', '{\"must_reset_password\": true, \"migrated_at\": \"x\", \"manter\": 1}'::jsonb),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Bia@Exemplo.test', '{\"must_reset_password\": true}'::jsonb),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'o''brien@exemplo.test', '{\"must_reset_password\": \"sim\"}'::jsonb)) v(id, email, raw_user_meta_data)" >/dev/null
run env DEST_DB_URL="$DST" bash "$MIG/auth/import-identities.sh" --dry-run
has "3 entrariam" "--dry-run calcula"
is "$(cnt "$DES" auth.identities)" "0" "--dry-run não grava"
run env DEST_DB_URL="$DST" bash "$MIG/auth/import-identities.sh"
rc_is 2 "sem confirmação não importa"
run env DEST_DB_URL="$DST" bash "$MIG/auth/import-identities.sh" --yes
has "3 inserida(s)" "import real (coluna gerada 'email' recalculada no destino)"
is "$(pga -d "$DES" -c "SELECT email FROM auth.identities WHERE provider_id = 'g-1'")" "ana@exemplo.test" "coluna gerada preenchida"
run env DEST_DB_URL="$DST" bash "$MIG/auth/import-identities.sh" --yes
has "0 inserida(s), 3 já existiam" "2ª execução é idempotente"
cp auth-identities.csv "o'x \$(touch pwn).csv"
run env DEST_DB_URL="$DST" IN="o'x \$(touch pwn).csv" bash "$MIG/auth/import-identities.sh" --yes
rc_is 0 "nome de arquivo hostil não vira SQL nem comando"
falsy "nada foi executado a partir do nome do arquivo" test -e pwn
cd "$T_TMP" || exit 1

section "unmark-must-reset.sh + rollback.sh"
U="$MIG/unmark-must-reset.sh"
run env DEST_DB_URL="$DST" bash "$U"
rc_is 2 "sem argumentos: uso"
run env DEST_DB_URL="$DST" bash "$U" "o'brien@exemplo.test" "x' OR '1'='1" BIA@exemplo.test
rc_is 1 "e-mail inexistente (tentativa de injeção) → exit 1"
has "x' OR '1'='1: usuário não encontrado" "injeção tratada como texto"
is "$(pga -d "$DES" -c "SELECT count(*) FROM auth.users WHERE raw_user_meta_data ? 'must_reset_password'")" "1" "só os e-mails informados foram desmarcados (case-insensitive)"
run env DEST_DB_URL="$DST" bash "$U" "o'brien@exemplo.test"
rc_is 0 "repetir é idempotente"
has "já estava sem a flag" "informa que não havia o que fazer"
run env DEST_DB_URL="$DST" bash "$U" --all --dry-run
has "1 usuário(s) com a flag" "--all --dry-run conta"
run bash -c "echo no | DEST_DB_URL='$DST' bash '$U' --all"
rc_is 2 "--all sem 'yes' aborta"
is "$(pga -d "$DES" -c "SELECT count(*) FROM auth.users WHERE raw_user_meta_data ? 'must_reset_password'")" "1" "…sem alterar nada"
run env DEST_DB_URL="$DST" bash "$MIG/rollback.sh"
rc_is 0 "rollback.sh sem flag = dry-run"
has "MODO DRY-RUN" "lista os passos"
run env DEST_DB_URL="$DST" bash "$MIG/rollback.sh" --dry-run --i-know-what-im-doing
has "MODO DRY-RUN" "--dry-run vence a confirmação"
is "$(pga -d "$DES" -c "SELECT count(*) FROM auth.users WHERE raw_user_meta_data ? 'must_reset_password'")" "1" "dry-run não altera"
run env DEST_DB_URL="$DST" bash "$MIG/rollback.sh" --i-know-what-im-doing
rc_is 0 "rollback real executa o passo 5 (antes: exit 126 / uso do unmark)"
is "$(pga -d "$DES" -c "SELECT raw_user_meta_data::text FROM auth.users WHERE email = 'ana@exemplo.test'")" '{"manter": 1}' "flag e migrated_at removidos; demais chaves preservadas"
run env DEST_DB_URL="$DST" bash "$MIG/rollback.sh" --i-know-what-im-doing
rc_is 0 "rollback 2x é idempotente"
run env DEST_DB_URL="$DST" bash "$MIG/rollback.sh" --step 9
rc_is 2 "--step inválido"
run env DEST_DB_URL="postgresql://${PGA_USER}@127.0.0.1:1/x" bash "$MIG/rollback.sh" --i-know-what-im-doing
rc_is 1 "falha no passo automático → exit 1"

section "dashboard.sh e ddl/verify-extensions.sh"
run env DEST_DB_URL="$DST" bash "$MIG/dashboard.sh" --once
rc_is 0 "dashboard --once"
has "Storage (contagem por bucket)" "seções presentes"
run env DEST_DB_URL="postgresql://${PGA_USER}@127.0.0.1:1/x" bash "$MIG/dashboard.sh" --once
rc_is 1 "dashboard --once com destino fora do ar"
has "(sem acesso ao DB)" "mostra aviso em vez de morrer calado"
run env DEST_DB_URL="$DST" WINDOW_MIN=abc bash "$MIG/dashboard.sh" --once
rc_is 2 "WINDOW_MIN inválido"
run env DEST_DB_URL="$DST" REFRESH_SEC=1 python3 "$T_LIB/sigrun.py" 2.5 INT bash "$MIG/dashboard.sh"
rc_is 0 "Ctrl+C no laço encerra limpo (exit 0)"
has "(dashboard encerrado)" "mensagem de saída"
X="$T_TMP/ext.sql"
printf 'CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;\nCREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;\ncreate extension pg_trgm;\n' > "$X"
run env DEST_DB_URL="$DST" EXTENSIONS_SQL="$X" bash "$MIG/ddl/verify-extensions.sh"
rc_is 0 "extensão com hífen entre aspas (\"uuid-ossp\") reconhecida (antes: procurava 'uuid')"
echo 'CREATE EXTENSION IF NOT EXISTS extensao_que_nao_existe;' >> "$X"
run env DEST_DB_URL="$DST" EXTENSIONS_SQL="$X" bash "$MIG/ddl/verify-extensions.sh"
rc_is 1 "extensão ausente reprova"
has "- extensao_que_nao_existe" "lista a ausente"
run env DEST_DB_URL="postgresql://${PGA_USER}@127.0.0.1:1/x" EXTENSIONS_SQL="$X" bash "$MIG/ddl/verify-extensions.sh"
rc_is 2 "destino inacessível é erro de config/conexão"
run env DEST_DB_URL="$DST" bash "$MIG/ddl/verify-extensions.sh"
has "uuid-ossp" "lê o 00_extensions.sql real do repositório"
finish
