#!/usr/bin/env bash
# dr.test.sh — DR e pós-cutover: backup-encryption-check (claro, GPG, age,
# openssl), par create-drill-backup.mjs + restore-drill.sh ponta a ponta,
# full-restore, wal-archive-check, rotate-jwt e post-cutover-watch.
# Sobe DOIS clusters efêmeros (origem "prod" e destino "drill": o restore-drill
# exige instâncias distintas) com initdb em /tmp. Sem initdb, pula.
# shellcheck disable=SC2016  # trechos em aspas simples são o código literal dos binários falsos
# shellcheck source-path=SCRIPTDIR source=lib/harness.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/harness.sh"
pg_eph_ok || skip_all "initdb/pg_ctl não encontrados (ou sem usuário postgres) — não dá para subir os clusters efêmeros"
pg_eph_start || { fail "cluster efêmero (prod)"; finish; }
PROD_PORT="$EPH_PORT"
eph_mkdb prod "$T_LIB/fixture-schema.sql" "$T_LIB/fixture-data.sql" || { fail "fixture prod"; finish; }
pg_eph_start || { fail "cluster efêmero (drill)"; finish; }
DRILL_PORT="$EPH_PORT"
eph_mkdb drill || { fail "banco drill"; finish; }
prod()  { psql -h 127.0.0.1 -p "$PROD_PORT"  -U postgres -d prod  -XAtq -v ON_ERROR_STOP=1 -c "$1"; }
drill() { psql -h 127.0.0.1 -p "$DRILL_PORT" -U postgres -d "${2:-drill}" -XAtq -v ON_ERROR_STOP=1 -c "$1"; }
DR="$MIG/dr"; W="$T_TMP/drill dir"; mkdir -p "$W"
export GNUPGHOME="$T_TMP/gnupg"; mkdir -m 700 "$GNUPGHOME"
PW='frase $ecreta com espaço'
cd "$T_TMP" || exit 1

section "create-drill-backup.mjs (docker falso executa o pg_dump local)"
fake_bin docker 'shift; while [[ $# -gt 0 ]]; do case "$1" in --user|-e|-w) shift 2 ;; *) break ;; esac; done; shift
[[ -n "${FAKE_DOCKER_FAIL:-}" ]] && exit 1
exec "$@"'
export PROD_DB_URL="postgresql://postgres@127.0.0.1:$PROD_PORT/prod?sslmode=disable&application_name=marker-nao-publicar"
export CRITICAL_TABLES="contacts,deals,user_roles"
MJS=(env BACKUP_FILE="$W/backup.dump" SOURCE_COUNTS_FILE="$W/counts.tsv" CONTAINER_BACKUP_FILE="$W/backup.dump" PGPASSWORD=senhaAMBIENTE PATH="$T_FAKE:$PATH" node "$DR/create-drill-backup.mjs")
if (cd "$REPO" && node -e "import('pg').then(() => process.exit(0), () => process.exit(1))") 2>/dev/null; then
  HAVE_PG_MODULE=1
  run "${MJS[@]}"
  rc_is 0 "gera dump + manifesto"
  hasnt "marker-nao-publicar" "dados de conexão não aparecem na saída"
  is "$(sed -n '1s/\t.*//p;2s/\t.*//p' "$W/counts.tsv" | tr '\n' ' ')" "#sha256 #snapshot " "manifesto: #sha256 e #snapshot nas duas primeiras linhas"
  is "$(grep -P '^contacts\t' "$W/counts.tsv")" "$(printf 'contacts\t4')" "contagem do snapshot"
  is "$(awk -F '\t' 'NR == 1 {print $2}' "$W/counts.tsv")" "$(sha256sum "$W/backup.dump" | cut -d ' ' -f 1)" "SHA-256 do manifesto = hash do dump"
  is "$(stat -c %a "$W/counts.tsv")|$(stat -c %a "$W/backup.dump")" "600|600" "manifesto e dump com permissão 600"
  has_docker="$(grep -c '^docker exec --user [0-9]*:[0-9]* -e PGHOST -e PGPORT -e PGUSER -e PGDATABASE -e PGPASSWORD -e PGSSLMODE -e PGSSLROOTCERT singu-drill pg_dump --snapshot=' "$FAKE_LOG")"
  is "$has_docker" "1" "chama docker exec … pg_dump --snapshot=… (senha só por nome de variável)"
  falsy "senha e URL não vão para o argv do docker" grep -qE "senhaAMBIENTE|marker-nao-publicar|postgresql://" "$FAKE_LOG"
  cp "$W/counts.tsv" "$T_TMP/antigo.tsv"
  run env FAKE_DOCKER_FAIL=1 BACKUP_FILE="$W/backup.dump" SOURCE_COUNTS_FILE="$T_TMP/antigo.tsv" PATH="$T_FAKE:$PATH" node "$DR/create-drill-backup.mjs"
  rc_is 1 "pg_dump falha → exit 1"; has "Falha na etapa pg_dump" "diz a etapa"
  falsy "manifesto antigo é removido quando o dump falha (não sobra manifesto 'válido')" test -e "$T_TMP/antigo.tsv"
  run env CRITICAL_TABLES="contacts,contacts" "${MJS[@]:1}"; rc_is 1 "tabela repetida é rejeitada"
  run env CRITICAL_TABLES='contacts;drop' "${MJS[@]:1}"; rc_is 1 "nome de tabela inválido é rejeitado"
  run env PROD_DB_URL="postgresql://postgres@127.0.0.1:1/x" "${MJS[@]:1}"; rc_is 1 "origem inacessível"; hasnt "127.0.0.1:1" "erro não expõe host/URL"
  run "${MJS[@]}"; rc_is 0 "regenera para os próximos testes"
else
  HAVE_PG_MODULE=0
  echo "    (módulo npm 'pg' ausente — gerando dump/manifesto à mão; rode npm ci para cobrir o .mjs)"
  pg_dump -Fc --no-owner --no-privileges -d "postgresql://postgres@127.0.0.1:$PROD_PORT/prod" -f "$W/backup.dump"
  printf '#sha256\t%s\n#snapshot\t00000003-00000001-1\ncontacts\t4\ndeals\t7\nuser_roles\t2\n' "$(sha256sum "$W/backup.dump" | cut -d ' ' -f 1)" > "$W/counts.tsv"
fi

section "backup-encryption-check.sh"
chk() { local f="$1"; shift; run env "$@" BACKUP_FILE="$f" HOME="$T_TMP" bash "$DR/backup-encryption-check.sh"; }
chk "$W/backup.dump"; rc_is 0 "dump em claro"; has "backup íntegro e decriptável" ""
chk "$W/nao-existe.dump"; rc_is 2 "arquivo inexistente"
run env -u BACKUP_FILE HOME="$T_TMP" bash "$DR/backup-encryption-check.sh"; is "$(( RC != 0 ))" 1 "BACKUP_FILE ausente falha"
head -c 5000 /dev/zero | tr '\0' 'x' > "$W/lixo.bin"
chk "$W/lixo.bin"; rc_is 1 "arquivo que não é dump → 1 com diagnóstico (antes: morria calado)"; has "não é um dump custom válido" ""
sz="$(wc -c < "$W/backup.dump")"; head -c $((sz - 60)) "$W/backup.dump" > "$W/truncado.dump"
chk "$W/truncado.dump"; rc_is 1 "dump truncado na área de dados é detectado (antes: --list passava e dizia 'íntegro')"
chk "$W/truncado.dump" BACKUP_DEEP_CHECK=0; rc_is 0 "BACKUP_DEEP_CHECK=0 confere só o índice"
if command -v gpg >/dev/null 2>&1; then
  printf '%s' "$PW" | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 0 --symmetric -o "$W/backup.gpg" "$W/backup.dump" 2>/dev/null
  printf '%s' "$PW" | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 0 --symmetric --armor -o "$W/backup.asc" "$W/backup.dump" 2>/dev/null
  chk "$W/backup.gpg" BACKUP_PASSPHRASE="$PW"; rc_is 0 "GPG simétrico BINÁRIO (antes: não era detectado → exit 1 sem mensagem)"; has "detectado GPG-encrypted" ""
  hasnt "$PW" "passphrase não aparece na saída"
  chk "$W/backup.asc" BACKUP_PASSPHRASE="$PW"; rc_is 0 "GPG ASCII-armored"
  chk "$W/backup.gpg" BACKUP_PASSPHRASE="errada"; rc_is 1 "passphrase errada"; has "decrypt falhou" ""
  falsy "nenhum dump decriptado sobra em disco" bash -c "find '${TMPDIR:-/tmp}' -maxdepth 2 -name backup.dump -newer '$W/backup.gpg' -user \"\$(id -un)\" | grep -q ."
else echo "    (gpg ausente — casos GPG pulados)"; fi
if command -v age >/dev/null 2>&1 && command -v age-keygen >/dev/null 2>&1; then
  age-keygen -o "$W/age.key" 2>/dev/null
  age -r "$(grep -o 'age1[a-z0-9]*' "$W/age.key" | head -n 1)" -o "$W/backup.age" "$W/backup.dump"
  chk "$W/backup.age" AGE_IDENTITY_FILE="$W/age.key"; rc_is 0 "age"
  chk "$W/backup.age"; rc_is 2 "age sem AGE_IDENTITY_FILE"
else echo "    (age ausente — casos age pulados)"; fi
if command -v openssl >/dev/null 2>&1; then
  openssl enc -aes-256-cbc -pbkdf2 -pass fd:3 -in "$W/backup.dump" -out "$W/backup.enc" 3<<<"$PW"
  chk "$W/backup.enc" BACKUP_PASSPHRASE="$PW"; rc_is 0 "openssl enc (Salted__)"
  chk "$W/backup.enc" BACKUP_PASSPHRASE="errada"; rc_is 1 "openssl com senha errada"
fi

section "restore-drill.sh (prod e drill em clusters distintos)"
DRILL_URL="postgresql://g6_pw:p%40ss%20w0rd%24%25@127.0.0.1:$DRILL_PORT/drill"
RD=(env DRILL_DB_URL="$DRILL_URL" BACKUP_FILE="$W/backup.dump" SOURCE_COUNTS_FILE="$W/counts.tsv" DRILL_REPORT_DIR="$W/rep" HOME="$T_TMP" bash "$DR/restore-drill.sh")
run "${RD[@]}"
rc_is 0 "restore + paridade (senha do drill com @, espaço, \$ e % na URL)"
has "✔ contacts: snapshot=4 drill=4" "paridade por tabela"; has "Restore e paridade das tabelas críticas validados" ""
is "$(drill "SELECT count(*) FROM public.deals")" "7" "dados restaurados no drill"
is "$(prod "SELECT count(*) FROM public.deals")" "7" "origem não foi tocada"
REP="$(ls "$W"/rep/restore-drill-*.md | tail -n 1)"
falsy "relatório sem URL, senha ou marcador de conexão" grep -qE "postgresql://|w0rd|marker-nao-publicar" "$REP"
is "$(stat -c %a "$REP")" "600" "relatório 600"
falsy "log bruto do pg_restore é apagado" bash -c "ls -A '$W/rep' | grep -q '^\.pg-restore'"
prod "INSERT INTO public.contacts (id, name) VALUES ('10000000-0000-0000-0000-0000000000ff', 'pós-snapshot')" >/dev/null
run "${RD[@]}"; rc_is 0 "escrita na origem DEPOIS do snapshot não reprova (compara com o manifesto) e o drill é reexecutável"
prod "DELETE FROM public.contacts WHERE name = 'pós-snapshot'" >/dev/null
run env DRILL_DB_URL="postgresql://postgres@127.0.0.1:$PROD_PORT/prod" "${RD[@]:2}"
rc_is 2 "origem e destino no MESMO cluster → recusa (2)"; has "instâncias PostgreSQL distintas" ""
is "$(prod "SELECT count(*) FROM public.contacts")" "4" "…sem restaurar por cima da origem"
sed 's/^contacts\t4$/contacts\t5/' "$W/counts.tsv" > "$W/drift.tsv"
run env SOURCE_COUNTS_FILE="$W/drift.tsv" "${RD[@]:1}"; rc_is 1 "drift de contagem → 1"; has "DRILL FALHOU" ""
run env SOURCE_COUNTS_FILE="$W/drift.tsv" DRIFT_MAX_PCT=25 "${RD[@]:1}"; rc_is 0 "DRIFT_MAX_PCT tolera 20%"
sed '1s/[0-9a-f]\{8\}$/00000000/' "$W/counts.tsv" > "$W/hash.tsv"
run env SOURCE_COUNTS_FILE="$W/hash.tsv" "${RD[@]:1}"; rc_is 2 "hash do manifesto ≠ backup → 2"
printf 'contacts\t4\textra\n' >> "$W/hash.tsv"
run env SOURCE_COUNTS_FILE="$W/hash.tsv" "${RD[@]:1}"; rc_is 2 "manifesto malformado → 2"
run env CRITICAL_TABLES="contacts,nao_no_manifesto" "${RD[@]:1}"; rc_is 2 "tabela crítica fora do manifesto → 2"
run env DRIFT_MAX_PCT=abc "${RD[@]:1}"; rc_is 2 "DRIFT_MAX_PCT inválido → 2"
run env DRILL_DB_URL="postgresql://g6_pw:errada@127.0.0.1:$DRILL_PORT/drill" "${RD[@]:2}"; rc_is 2 "drill inacessível → 2"
run env BACKUP_FILE="$W/truncado.dump" "${RD[@]:1}"; rc_is 2 "backup trocado/truncado (hash não confere) → 2"
if command -v gpg >/dev/null 2>&1; then
  run env BACKUP_FILE="$W/backup.gpg" BACKUP_PASSPHRASE="$PW" "${RD[@]:1}"
  rc_is 0 "backup GPG: decripta, confere o hash do conteúdo e restaura"; has "backup cifrado (gpg) decriptado" ""
  falsy "dump decriptado temporário é apagado" bash -c "ls -A '$W/rep' | grep -q drill-dump"
  run env BACKUP_FILE="$W/backup.gpg" BACKUP_PASSPHRASE="errada" "${RD[@]:1}"; rc_is 2 "backup GPG com senha errada → 2"
  falsy "…e não deixa temporário" bash -c "ls -A '$W/rep' | grep -q drill-dump"
fi
run env PROD_DB_URL="x" DRILL_DB_URL="y" BACKUP_FILE="$W/backup.dump" SOURCE_COUNTS_FILE="$W/counts.tsv" DRILL_REPORT_DIR="$W/rep" python3 "$T_LIB/sigrun.py" 0.05 TERM bash "$DR/restore-drill.sh"
is "$(( RC == 2 || RC == 130 ))" 1 "interrupção/preflight nunca sai 0"

section "rollback/full-restore.sh"
SN="$T_TMP/snap"; mkdir -p "$SN"; cp "$W/backup.dump" "$SN/db.dump"
drill "CREATE DATABASE alvo TEMPLATE template0" postgres >/dev/null
FR=(env SNAPSHOT_DIR="$SN" DEST_DB_URL="postgresql://g6_pw:p%40ss%20w0rd%24%25@127.0.0.1:$DRILL_PORT/alvo" HOME="$T_TMP" bash "$MIG/rollback/full-restore.sh")
alvo() { drill "$1" alvo; }
run "${FR[@]}"; rc_is 0 "sem flags = dry-run"; has "DRY-RUN" ""
run bash -c "echo RESTAURAR | SNAPSHOT_DIR='$SN' DEST_DB_URL='postgresql://postgres@127.0.0.1:$DRILL_PORT/alvo' bash '$MIG/rollback/full-restore.sh' --dry-run --confirm --i-know-what-im-doing"
rc_is 0 "--dry-run junto das confirmações"; has "DRY-RUN" "--dry-run SEMPRE vence (antes: a última flag ganhava e restaurava)"
is "$(alvo "SELECT to_regclass('public.contacts') IS NULL")" "t" "…nada foi restaurado"
run "${FR[@]}" --confirm; rc_is 2 "só uma das duas flags"
run bash -c "echo nao | SNAPSHOT_DIR='$SN' DEST_DB_URL='postgresql://postgres@127.0.0.1:$DRILL_PORT/alvo' bash '$MIG/rollback/full-restore.sh' --confirm --i-know-what-im-doing"
rc_is 2 "palavra de confirmação errada"; is "$(alvo "SELECT to_regclass('public.contacts') IS NULL")" "t" "…nada restaurado"
run bash -c "echo RESTAURAR | SNAPSHOT_DIR='$SN' DEST_DB_URL='postgresql://g6_pw:p%40ss%20w0rd%24%25@127.0.0.1:$DRILL_PORT/alvo' bash '$MIG/rollback/full-restore.sh' --confirm --i-know-what-im-doing"
rc_is 0 "restauração real"; is "$(alvo "SELECT count(*) FROM public.contacts")" "4" "dados restaurados"; hasnt "w0rd" "senha não aparece"
run bash -c "echo RESTAURAR | RESTORE_ATOMIC=1 SNAPSHOT_DIR='$SN' DEST_DB_URL='postgresql://postgres@127.0.0.1:$DRILL_PORT/alvo' bash '$MIG/rollback/full-restore.sh' --confirm --i-know-what-im-doing"
rc_is 0 "2ª restauração (idempotente), em transação única"
printf 'A=1\nB=dois\n' > "$SN/secrets.env"
run bash -c "echo RESTAURAR | SNAPSHOT_DIR='$SN' DEST_DB_URL='postgresql://postgres@127.0.0.1:$DRILL_PORT/alvo' HOME='$T_TMP' bash '$MIG/rollback/full-restore.sh' --confirm --i-know-what-im-doing"
rc_is 2 "snapshot com secrets e sem DEST_REF: aborta ANTES de restaurar"
fake_bin supabase 'if [[ "$1 $2" == "secrets set" ]]; then for a in "$@"; do [[ "${prev:-}" == "--env-file" ]] && cp "$a" "$FAKE_LOG.sent"; prev="$a"; done; fi
[[ "$1 $2" == "secrets list" ]] && printf "A | x\nB | y\n"; exit 0'
: > "$FAKE_LOG"
run bash -c "echo RESTAURAR | DEST_REF=refnovorefnovo123456 PATH='$T_FAKE':\$PATH SNAPSHOT_DIR='$SN' DEST_DB_URL='postgresql://postgres@127.0.0.1:$DRILL_PORT/alvo' bash '$MIG/rollback/full-restore.sh' --confirm --i-know-what-im-doing"
rc_is 0 "restaura e reaplica os secrets DO SNAPSHOT"
is "$(cat "$FAKE_LOG.sent" 2>/dev/null)" "A=1
B=dois" "secrets enviados são os do snapshot (antes: SECRETS_ENV era ignorado e ./functions/… dependia do cwd)"
head -c 400 "$SN/db.dump" > "$SN/x" && mv "$SN/x" "$SN/db.dump"
run bash -c "echo RESTAURAR | SNAPSHOT_DIR='$SN' DEST_DB_URL='postgresql://postgres@127.0.0.1:$DRILL_PORT/alvo' bash '$MIG/rollback/full-restore.sh' --confirm --i-know-what-im-doing"
rc_is 1 "dump corrompido é recusado no preflight"; is "$(alvo "SELECT count(*) FROM public.contacts")" "4" "…sem apagar o que estava no destino"

section "dr/wal-archive-check.sh"
export WAL_ARCHIVE_STATE_DIR="$T_TMP/wal state"
WA=(env SRC_DB_URL="postgresql://postgres@127.0.0.1:$PROD_PORT/prod" HOME="$T_TMP" bash "$DR/wal-archive-check.sh")
prod "SELECT pg_switch_wal()" >/dev/null; sleep 1.5
run "${WA[@]}"; rc_is 0 "archiving saudável"; has "primeira execução" ""
run "${WA[@]}"; rc_is 0 "2ª execução"; has "failed_count estável (Δ=0)" ""
ST="$(ls "$WAL_ARCHIVE_STATE_DIR"/*.state)"
is "$(stat -c %a "$ST")|$(stat -c %a "$WAL_ARCHIVE_STATE_DIR")" "600|700" "estado privado (antes: /tmp/wal-archive-check.state previsível)"
echo 'failed[$(touch '"$T_TMP"'/pwn-wal)]' > "$ST"
run "${WA[@]}"; rc_is 0 "estado adulterado é ignorado"; has "estado anterior inválido" ""
falsy "conteúdo do estado NÃO é executado (antes: injeção via aritmética do bash)" test -e "$T_TMP/pwn-wal"
echo 0 > "$ST"; ln -sf "$T_TMP/alvo-do-link" "$ST.lnk"; mv -f "$ST.lnk" "$ST"
run "${WA[@]}"; rc_is 2 "estado é link simbólico → recusa"; falsy "…e não escreve através do link" test -e "$T_TMP/alvo-do-link"
rm -f "$ST"
run env ARCHIVE_MAX_LAG_SEC=0 "${WA[@]:1}"; rc_is 1 "lag acima do limite → 1"
psql -h 127.0.0.1 -p "$PROD_PORT" -U postgres -d postgres -Xqc "ALTER SYSTEM SET archive_command = 'false'" -c "SELECT pg_reload_conf()" >/dev/null
prod "SELECT pg_switch_wal()" >/dev/null 2>&1; prod "CREATE TABLE IF NOT EXISTS public._w (i int); INSERT INTO public._w VALUES (1); SELECT pg_switch_wal()" >/dev/null; sleep 2.5
run "${WA[@]}"; rc_is 1 "archive_command falhando → 1"; has "FALHOU" "detecta que a última tentativa falhou"
run env SRC_DB_URL="postgresql://postgres@127.0.0.1:1/x" "${WA[@]:2}"
rc_is 2 "banco inacessível → 2 (antes: 'archiving nunca rodou', exit 1)"; has "DESCONHECIDA" ""
run env ARCHIVE_MAX_LAG_SEC=abc "${WA[@]:1}"; rc_is 2 "limite inválido"

section "auth/rotate-jwt.sh (JWKS servido em 127.0.0.1)"
WWW="$T_TMP/www/auth/v1/.well-known"; mkdir -p "$WWW"; JW="$WWW/jwks.json"
JP=""; for p in $(seq 55470 55479); do if ! (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then JP=$p; break; fi; done
(cd "$T_TMP/www" && exec python3 -m http.server "$JP" --bind 127.0.0.1 >/dev/null 2>&1) & T_PIDS+=($!)
for _ in 1 2 3 4 5 6 7 8 9 10; do (exec 3<>"/dev/tcp/127.0.0.1/$JP") 2>/dev/null && break; sleep 0.2; done
echo '{"keys":[{"kid":"antiga","kty":"EC"}]}' > "$JW"
SD="$T_TMP/rot state"
RJ=(env DEST_SUPABASE_URL="http://127.0.0.1:$JP" ROTATE_STATE_DIR="$SD" HOME="$T_TMP" bash "$MIG/auth/rotate-jwt.sh")
ago() { date -u -d "$1" +%Y-%m-%dT%H:%M:%SZ; }
run env -i PATH="$PATH" HOME="$T_TMP" bash "$MIG/auth/rotate-jwt.sh" help; rc_is 0 "help sem nenhuma variável (antes: exigia DEST_SERVICE_ROLE_KEY)"
run "${RJ[@]}" bogus; rc_is 2 "etapa desconhecida"
run "${RJ[@]}" retire; rc_is 2 "retire antes de activate"
run "${RJ[@]}" activate; rc_is 2 "activate antes de prepare"
run "${RJ[@]}" prepare; rc_is 0 "prepare"; has "JWKS atual publica 1 chave(s)" "registra as chaves atuais"
S1="$(head -n 1 "$SD/.rotate-state.json.prepared")"
run "${RJ[@]}" prepare; rc_is 0 "prepare 2x"; is "$(head -n 1 "$SD/.rotate-state.json.prepared")" "$S1" "…não altera o carimbo original"
run "${RJ[@]}" activate; rc_is 1 "activate antes de 24h é barrado (antes: ativava na hora)"
sed -i "1s/.*/$(ago '25 hours ago')/" "$SD/.rotate-state.json.prepared"
run "${RJ[@]}" activate
rc_is 1 "activate sem a standby no JWKS é barrado"; has "standby NÃO foi criada" "explica o risco"
falsy "ativação barrada não é registrada" test -e "$SD/.rotate-state.json.activated"
echo '{"keys":[{"kid":"antiga"},{"kid":"nova"}]}' > "$JW"
run "${RJ[@]}" activate; rc_is 0 "activate com standby publicada"
run "${RJ[@]}" retire; rc_is 1 "retire antes do grace de 24h"
echo "lixo" > "$SD/.rotate-state.json.activated"
run "${RJ[@]}" retire
rc_is 1 "estado corrompido ABORTA (antes: tratava como 'há muito tempo' e concluía a rotação)"
truthy "…sem apagar nem registrar nada" test -e "$SD/.rotate-state.json.prepared"
falsy "…sem marcar retired" test -e "$SD/.rotate-state.json.retired"
ago '30 hours ago' > "$SD/.rotate-state.json.activated"
echo '{"keys":[]}' > "$JW"
run "${RJ[@]}" retire; rc_is 1 "retire com JWKS vazio é barrado (ficaria sem chave válida)"
mv "$JW" "$JW.off"
run "${RJ[@]}" retire; rc_is 1 "JWKS inacessível → não registra"; truthy "estado preservado" test -e "$SD/.rotate-state.json.activated"
mv "$JW.off" "$JW"; echo '{"keys":[{"kid":"nova"},{"kid":"antiga"}]}' > "$JW"
run "${RJ[@]}" retire; rc_is 0 "retire com grace cumprido e JWKS ok"
run "${RJ[@]}" status; rc_is 0 "status"; has "retired: 20" "carimbo final registrado"
run env ROTATE_MIN_WAIT_HOURS=abc "${RJ[@]:1}" prepare; rc_is 2 "espera mínima inválida"

section "monitoring/post-cutover-watch.sh (curl falso + banco efêmero)"
drill "CREATE TABLE public.behavioral_profile_regen_queue (id serial, processed_at timestamptz); CREATE TABLE public.system_health_snapshots (id serial, created_at timestamptz DEFAULT now()); INSERT INTO public.system_health_snapshots DEFAULT VALUES" alvo >/dev/null 2>&1 || true
fake_bin curl 'for a in "$@"; do [[ "$a" == @* ]] && cp "${a#@}" "$FAKE_LOG.headers"; done
printf "%s" "${FAKE_CODE:-200}"; exit "${FAKE_CURL_EXIT:-0}"'
: > "$FAKE_LOG"
PC=(env DEST_DB_URL="postgresql://postgres@127.0.0.1:$DRILL_PORT/alvo" DEST_SUPABASE_URL=http://127.0.0.1:9 DEST_ANON_KEY=anonSEGREDO LOG_DIR="$T_TMP/watch logs" HOME="$T_TMP" PATH="$T_FAKE:$PATH" bash "$MIG/monitoring/post-cutover-watch.sh")
run "${PC[@]}" --once; rc_is 0 "rodada OK"; has "OK queue=0" ""; hasnt "anonSEGREDO" "chave não aparece na saída"
falsy "chave não vai para o argv do curl (antes: -H \"apikey: …\")" grep -q "anonSEGREDO" "$FAKE_LOG"
is "$(grep -c 'anonSEGREDO' "$FAKE_LOG.headers")" "2" "apikey + Authorization vão por arquivo de cabeçalhos"
falsy "log sem códigos de cor" grep -q $'\033' "$T_TMP/watch logs"/*.log
run env FAKE_CODE=503 "${PC[@]:1}" --once; rc_is 1 "rodada com ERROR → exit 1 (antes: sempre 0)"; has "storage=503 ef=503" ""
run env FAKE_CODE=000 FAKE_CURL_EXIT=7 "${PC[@]:1}" --once; has "storage=000 ef=000" "falha do curl vira 000 (antes: '000000')"
run env DEST_DB_URL="postgresql://postgres@127.0.0.1:1/x" "${PC[@]:1}" --once; rc_is 1 "banco fora do ar conta como ERROR"; has "queue=ERR" ""
run env WINDOW_HRS=1 INTERVAL_SEC=1 "${PC[@]:1}" --opcao; rc_is 2 "flag desconhecida"
run env WINDOW_HRS=1 INTERVAL_SEC=1 DEST_DB_URL="postgresql://postgres@127.0.0.1:$DRILL_PORT/alvo" DEST_SUPABASE_URL=http://127.0.0.1:9 DEST_ANON_KEY=k LOG_DIR="$T_TMP/watch logs" PATH="$T_FAKE:$PATH" python3 "$T_LIB/sigrun.py" 2.5 INT bash "$MIG/monitoring/post-cutover-watch.sh"
rc_is 0 "Ctrl+C no laço encerra limpo"; has "Watch encerrado" ""
is "$HAVE_PG_MODULE" "$HAVE_PG_MODULE" "(módulo pg presente=$HAVE_PG_MODULE)"
finish
