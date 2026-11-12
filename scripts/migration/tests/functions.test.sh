#!/usr/bin/env bash
# functions.test.sh — scripts de Edge Functions, Storage e reset de senhas com
# CLIs falsas no PATH (supabase, deno, curl): comando certo, ordem certa,
# segredo fora do argv/log e comportamento quando a CLI falha no meio.
# Não precisa de banco nem de rede (o health check usa servidor em 127.0.0.1).
# shellcheck disable=SC2016  # trechos em aspas simples são o código literal dos binários falsos
# shellcheck source-path=SCRIPTDIR source=lib/harness.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/harness.sh"
F="$MIG/functions"; R="refnovorefnovo123456"; OLD="refantigorefantigo12"
FD="$T_TMP/supabase/functions"
mkdir -p "$FD"/{_shared,tests,alpha,beta,gamma,health,incoming-webhook,sem-index}
for d in alpha beta gamma health incoming-webhook; do echo 'Deno.env.get("CRON_SECRET");' > "$FD/$d/index.ts"; done
export FUNCTIONS_DIR="$FD" DEPLOY_LOG="$T_TMP/deploy.log" DEPLOY_SLEEP_SEC=0

section "secrets-leak-scan.sh (antes: grep -E -P conflitava e NUNCA achava nada)"
J="$T_JWT"   # valores com cara de segredo vêm do harness (montados em runtime)
leak() { rm -rf "$T_TMP/scan"; mkdir -p "$T_TMP/scan"; printf '%s\n' "$2" > "$T_TMP/scan/$1"; run bash "$F/secrets-leak-scan.sh" "$T_TMP/scan"; }
leak a.ts "const k = \"$J\";";                                     rc_is 1 "JWT literal"
hasnt "$T_JWT_SIG" "o segredo achado é mascarado na saída"
has "a.ts:1: [jwt]" "aponta arquivo:linha e o tipo"
leak a.ts "const k = Deno.env.get(\"X\") ?? \"$J\";";              rc_is 1 "JWT como fallback de Deno.env.get (antes: linha era ignorada)"
leak a.ts "const t = \"$T_SBP\";"; rc_is 1 "token pessoal sbp_"
leak a.ts "const s = \"$T_SBSECRET\";";   rc_is 1 "chave sb_secret_"
leak a.ts "const u = \"$(pgurl postgres SenhaForte123 db.abc.supabase.co:5432/postgres)\";"; rc_is 1 "URL de Postgres com senha"
leak a.ts 'const SUPABASE_SERVICE_ROLE_KEY = "abcdefghijklmnopqrstuvwxyz0123";'; rc_is 1 "atribuição literal de *_KEY"
leak a.ts "$T_PEM_BEGIN";                            rc_is 1 "chave privada"
leak cfg.json "{\"key\": \"$J\"}";                                  rc_is 1 "segredo em .json (antes: só .ts/.js)"
leak a.ts 'const ok = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); const u = "postgresql://postgres:<pwd>@db.<ref>.supabase.co/postgres"; const v = `postgres://u:${pw}@h/db`;'
rc_is 0 "leitura de env e URLs com placeholder não são falso-positivo"
leak a.ts "const ex = \"$T_SBP\"; // leak-scan:allow exemplo"; rc_is 0 "linha liberada com leak-scan:allow"
leak a_test.ts "const k = \"$J\";";                                 rc_is 0 "arquivo de teste fica fora por padrão"
run env LEAK_SCAN_INCLUDE_TESTS=1 bash "$F/secrets-leak-scan.sh" "$T_TMP/scan"; rc_is 1 "LEAK_SCAN_INCLUDE_TESTS=1 inclui testes"
run bash "$F/secrets-leak-scan.sh" "$T_TMP/nao-existe";             rc_is 2 "diretório inexistente"

section "preflight-secrets.sh"
TPL="$T_TMP/template.env"; printf 'CRON_SECRET=\nSOBRANDO=\n' > "$TPL"
run env SECRETS_TEMPLATE="$TPL" bash "$F/preflight-secrets.sh"; rc_is 0 "tudo declarado"
has "SOBRANDO" "extras são só informados"
echo "requireWebhookSecret(req, 'NOVO_WEBHOOK_SECRET', 'x-h');" > "$FD/_shared/auth.ts"
echo 'Deno.env.get("SO_EM_TESTE")' > "$FD/alpha/index_test.ts"
run env SECRETS_TEMPLATE="$TPL" bash "$F/preflight-secrets.sh"
rc_is 1 "secret lido indiretamente (requireWebhookSecret) e fora do template reprova (antes: verde)"
has "- NOVO_WEBHOOK_SECRET" "lista o faltante"
hasnt "SO_EM_TESTE" "variável usada só em teste não conta"
rm "$FD/_shared/auth.ts"
run env SECRETS_TEMPLATE="$T_TMP/nao-existe" bash "$F/preflight-secrets.sh"; rc_is 2 "template ausente"

section "rewrite-cron-urls.sh"
run env OLD_REF="$OLD" NEW_REF="$R" bash "$F/rewrite-cron-urls.sh"; rc_is 0 "gera SQL"
has "cron.alter_job(jobid, command := replace(command, '$OLD', '$R'))" "usa cron.alter_job com os refs"
run env OLD_REF="abc" NEW_REF="x'y; DROP TABLE t" bash "$F/rewrite-cron-urls.sh"; rc_is 2 "ref com aspas/SQL é recusado (antes: ia para o SQL)"
run env OLD_REF="a%b_cdefghijklmnopq" NEW_REF="$R" bash "$F/rewrite-cron-urls.sh"; rc_is 2 "curingas de LIKE recusados"
run env OLD_REF="$R" NEW_REF="$R" bash "$F/rewrite-cron-urls.sh"; rc_is 2 "refs iguais"
run env -u OLD_REF NEW_REF="$R" HOME="$T_TMP" bash "$F/rewrite-cron-urls.sh"; rc_is 2 "OLD_REF ausente"

section "set-secrets.sh (CLI supabase falsa)"
SE="$T_TMP/secrets.env"
cat > "$SE" <<'ENVEOF'
# comentário
CRON_SECRET=abc def
QUOTED="valor entre aspas"
HASH=senha#com #hash
DOLLAR=pa$$w0rd${X}
  SPACED = x y
ASPAS=it's "q"
SUPABASE_URL=https://x
EMPTY=
export EXPORTED=1
ENVEOF
fake_bin supabase '
if [[ "$1 $2" == "secrets set" ]]; then
  for a in "$@"; do [[ "${prev:-}" == "--env-file" ]] && cp "$a" "$FAKE_LOG.envfile" && stat -c %a "$a" > "$FAKE_LOG.mode"; prev="$a"; done
  exit "${FAKE_SET_EXIT:-0}"
fi
if [[ "$1 $2" == "secrets list" ]]; then
  if [[ -n "${FAKE_LIST:-}" ]]; then echo "$FAKE_LIST"; else cut -d= -f1 "$FAKE_LOG.envfile" | sed "s/\$/ | digest/"; fi
  exit "${FAKE_LIST_EXIT:-0}"
fi'
run with_fakes bash "$F/set-secrets.sh" --project-ref "$R" --env-file "$SE" --dry-run
rc_is 0 "--dry-run"; has "enviar=7 | vazios=1 | reservados=1" "resumo"
is "$(fake_calls supabase)" "0" "--dry-run não chama a CLI"
hasnt "abc def" "--dry-run não imprime valores"
run with_fakes bash "$F/set-secrets.sh" --project-ref "$R" --env-file "$SE"
rc_is 2 "sem confirmação não aplica"; is "$(fake_calls supabase)" "0" "…e não chama a CLI"
run with_fakes bash "$F/set-secrets.sh" --project-ref "$R" --env-file "$SE" --yes
rc_is 0 "aplica com --yes"; has "Conferido: 7/7" "confere no destino com secrets list"
is "$(sed -n 1p "$FAKE_LOG" | sed 's|--env-file .*|--env-file <tmp>|')" "supabase secrets set --project-ref $R --env-file <tmp>" "1ª chamada: secrets set (valores fora do argv)"
is "$(sed -n 2p "$FAKE_LOG")" "supabase secrets list --project-ref $R" "2ª chamada: secrets list"
falsy "nenhum valor de secret no argv registrado" grep -qE "abc def|w0rd|valor entre" "$FAKE_LOG"
is "$(cat "$FAKE_LOG.mode")" "600" "arquivo temporário de secrets é 600"
is "$(cat "$FAKE_LOG.envfile")" "CRON_SECRET='abc def'
QUOTED='valor entre aspas'
HASH='senha#com #hash'
DOLLAR='pa\$\$w0rd\${X}'
SPACED='x y'
ASPAS=\"it's \\\"q\\\"\"
EXPORTED=1" "env-file: valores literais protegidos (\$, #, espaços, aspas); 'export' e espaços no nome tratados"
falsy "arquivo temporário apagado na saída" test -e "$(sed -n 1p "$FAKE_LOG" | awk '{print $NF}')"
: > "$FAKE_LOG"
run with_fakes env FAKE_LIST="CRON_SECRET | x" bash "$F/set-secrets.sh" --project-ref "$R" --env-file "$SE" --yes
rc_is 1 "aplicação parcial é detectada"; has "ausentes no destino: QUOTED HASH" "lista o que faltou"
run with_fakes env FAKE_SET_EXIT=7 bash "$F/set-secrets.sh" --project-ref "$R" --env-file "$SE" --yes
rc_is 1 "CLI falha → exit 1"; hasnt "Concluído" "não declara sucesso"
printf 'A=1\nLINHA SEM IGUAL\nA=2\n1X=3\n' > "$T_TMP/ruim.env"; : > "$FAKE_LOG"
run with_fakes bash "$F/set-secrets.sh" --project-ref "$R" --env-file "$T_TMP/ruim.env" --yes
rc_is 2 "arquivo inválido aborta antes de enviar"; is "$(fake_calls supabase)" "0" "nada enviado (tudo ou nada)"
has "A duplicado" "aponta duplicata"
run env PATH="/usr/bin:/bin" bash "$F/set-secrets.sh" --project-ref "$R" --env-file "$SE" --yes
rc_is 2 "CLI supabase ausente: erro de dependência"
run with_fakes env SECRETS_ENV="$SE" NEW_REF="$R" bash "$F/set-secrets.sh" --dry-run
rc_is 0 "SECRETS_ENV e NEW_REF (do env.example) são aceitos"
run with_fakes bash "$F/set-secrets.sh" --project-ref "x'; rm -rf" --env-file "$SE" --dry-run; rc_is 2 "project-ref inválido"

section "deploy-all.sh (CLI supabase falsa)"
fake_bin supabase '
[[ "$3" == "${FAKE_FAIL_FN:-}" ]] && { echo "erro: token $T_SBP inválido"; exit 1; }
[[ -n "${FAKE_SLOW:-}" ]] && sleep 2
echo "Deployed $3"'
: > "$FAKE_LOG"
run with_fakes bash "$F/deploy-all.sh" --project-ref "$R" --dry-run
rc_is 0 "--dry-run"; is "$(fake_calls supabase)" "0" "--dry-run não chama a CLI"
has "deploy incoming-webhook --project-ref $R --no-verify-jwt" "webhook sai com --no-verify-jwt"
has "ignorando sem-index (sem index.ts)" "pasta sem index.ts não é deployada"
run with_fakes bash "$F/deploy-all.sh" --project-ref "$R"
rc_is 2 "sem confirmação não publica"
run with_fakes env FAKE_FAIL_FN=beta bash "$F/deploy-all.sh" --project-ref "$R" --yes
rc_is 1 "uma função falha → exit 1"; has "Resumo: OK=4  FALHA=1  TOTAL_TENTADO=5" "contagem correta"
has "Retomar com: ./deploy-all.sh --from beta" "diz como retomar"
is "$(awk '{print $4}' "$FAKE_LOG" | tr '\n' ' ')" "alpha beta gamma health incoming-webhook " "ordem alfabética; continua após a falha"
is "$(grep -c -- '--no-verify-jwt' "$FAKE_LOG")" "1" "só a função da lista recebe --no-verify-jwt"
falsy "token da saída da CLI é mascarado no deploy.log" grep -q "${T_SBP:0:14}" "$DEPLOY_LOG"
: > "$FAKE_LOG"
run with_fakes bash "$F/deploy-all.sh" --project-ref "$R" --yes --from beta
rc_is 0 "--from"; is "$(awk '{print $4}' "$FAKE_LOG" | tr '\n' ' ')" "beta gamma health incoming-webhook " "--from retoma do ponto certo"
run with_fakes bash "$F/deploy-all.sh" --project-ref "$R" --yes --only nao-existe
rc_is 2 "--only inexistente é erro (antes: 'OK=0' e exit 0)"
run with_fakes bash "$F/deploy-all.sh" --project-ref "$R" --yes --from nao-existe
rc_is 2 "--from inexistente é erro (antes: exit 0 sem publicar nada)"
run env PATH="/usr/bin:/bin" bash "$F/deploy-all.sh" --project-ref "$R" --yes
rc_is 2 "CLI ausente: erro único (antes: N× FALHOU)"
run with_fakes env NEW_REF="$R" bash "$F/deploy-all.sh" --dry-run
rc_is 0 "NEW_REF do env.example serve de DEST_REF"
run with_fakes env FAKE_SLOW=1 python3 "$T_LIB/sigrun.py" 3 INT bash "$F/deploy-all.sh" --project-ref "$R" --yes
rc_is 130 "Ctrl+C no meio → 130"; has "Retomar com: ./deploy-all.sh --from" "resumo e ponto de retomada no Ctrl+C"

section "verify-deploy.sh (supabase falso + health em servidor local)"
INV='[{"slug":"alpha","status":"ACTIVE"},{"slug":"beta","status":"ACTIVE"},{"slug":"gamma","status":"ACTIVE"},{"slug":"health","status":"ACTIVE"},{"slug":"incoming-webhook","status":"ACTIVE"},{"slug":"extra-remota","status":"ACTIVE"}]'
fake_bin supabase 'printf "%s\n" "$FAKE_INVENTORY"; exit "${FAKE_LIST_EXIT:-0}"'
cat > "$T_TMP/srv.py" <<'PYEOF'
import http.server, json, os, sys
class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        with open(os.environ["HDR_LOG"], "a") as f:
            f.write(json.dumps({"path": self.path, "auth": self.headers.get("Authorization"), "apikey": self.headers.get("apikey")}) + "\n")
        mode = open(os.environ["MODE_FILE"]).read().strip()
        code = 500 if mode == "500" else 200
        body = b'{"status":"degraded"}' if mode == "degraded" else b'{"status":"healthy"}'
        self.send_response(code); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(body)
    def log_message(self, *a): pass
http.server.HTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
PYEOF
PORT=""; for p in $(seq 55480 55499); do if ! (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then PORT=$p; break; fi; done
echo ok > "$T_TMP/mode"
HDR_LOG="$T_TMP/hdr.log" MODE_FILE="$T_TMP/mode" python3 "$T_TMP/srv.py" "$PORT" & T_PIDS+=($!)
for _ in 1 2 3 4 5 6 7 8 9 10; do (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null && break; sleep 0.2; done
VD=(env FAKE_INVENTORY="$INV" FUNCTIONS_BASE_URL="http://127.0.0.1:$PORT/functions/v1" HEALTH_JWT=jwtSEGREDO SUPABASE_ANON_KEY=anonSEGREDO PATH="$T_FAKE:$PATH" bash "$F/verify-deploy.sh" --project-ref "$R")
run "${VD[@]}" --old-ref "$OLD"
rc_is 0 "inventário e health ok"; has "Locais: 5" "conta só pastas com index.ts"; has "Remotos ativos: 6" "conta remotos"
has "extra-remota" "lista remoto que não está no repo"; hasnt "SEGREDO" "JWT/apikey não aparecem na saída"
is "$(grep -c '"auth": "Bearer jwtSEGREDO", "apikey": "anonSEGREDO"' "$T_TMP/hdr.log")" "4" "os 4 health checks chegam autenticados (cabeçalhos por arquivo)"
has "ILIKE '%${OLD}.supabase.co%'" "SQL de auditoria de cron com o ref antigo"
run env FAKE_INVENTORY='[{"slug":"alpha","status":"INACTIVE"}]' PATH="$T_FAKE:$PATH" bash "$F/verify-deploy.sh" --project-ref "$R"
rc_is 1 "nenhuma função ativa"; has "Remotos ativos: 0" "contagem 0 (antes: dizia 1)"
run env FAKE_INVENTORY="${INV/\{\"slug\":\"beta\",\"status\":\"ACTIVE\"\},/}" PATH="$T_FAKE:$PATH" bash "$F/verify-deploy.sh" --project-ref "$R"
rc_is 1 "função local ausente no remoto reprova"; has "beta" "diz qual"
run env FAKE_INVENTORY='nao é json' PATH="$T_FAKE:$PATH" bash "$F/verify-deploy.sh" --project-ref "$R"; rc_is 1 "inventário inválido"
run env FAKE_INVENTORY="$INV" FAKE_LIST_EXIT=1 PATH="$T_FAKE:$PATH" bash "$F/verify-deploy.sh" --project-ref "$R"; rc_is 1 "supabase functions list falha"
echo 500 > "$T_TMP/mode"; run "${VD[@]}"; rc_is 1 "health HTTP 500 reprova"; has "4 endpoint(s) sem confirmação" "conta os reprovados"
echo degraded > "$T_TMP/mode"; run "${VD[@]}"; rc_is 1 "HTTP 200 sem status healthy reprova"
run env FAKE_INVENTORY="$INV" FUNCTIONS_BASE_URL="http://127.0.0.1:1/functions/v1" PATH="$T_FAKE:$PATH" bash "$F/verify-deploy.sh" --project-ref "$R"
rc_is 1 "health inacessível reprova"
run with_fakes bash "$F/verify-deploy.sh" --project-ref "$R" --old-ref "x'; DROP TABLE"; rc_is 2 "old-ref com SQL é recusado"
run with_fakes env -u DEST_REF HOME="$T_TMP" bash "$F/verify-deploy.sh"; rc_is 2 "sem project-ref"

section "storage/run.sh (deno falso)"
fake_bin deno 'echo "SRC=[$SRC_SUPABASE_URL] CONC=[${CONCURRENCY-unset}] ONLY=[${ONLY_BUCKET-unset}] DRY=[${DRY_RUN-unset}] step=${@: -1}"
[[ "${@: -1}" == "${FAKE_FAIL_STEP:-}" ]] && exit 5; exit 0'
SE2="$T_TMP/storage.env"; cp "$MIG/storage/env.example" "$SE2"; export STORAGE_ENV_FILE="$SE2"
run with_fakes bash "$MIG/storage/run.sh" --step list
rc_is 0 "--step list"; has "SRC=[https://SEU_REF_ORIGEM.supabase.co]" "aspas do env.example são removidas (antes: iam junto no valor)"
has "ONLY=[unset]" "ONLY_BUCKET vazio = sem filtro"
run with_fakes env CONCURRENCY=16 bash "$MIG/storage/run.sh" --step list
has "CONC=[16]" "CONCURRENCY=16 ./run.sh vence o .env (antes: o .env sobrescrevia)"
run with_fakes bash "$MIG/storage/run.sh" --step copy
rc_is 2 "copy sem confirmação não roda"; is "$(grep -c 'copy-objects.ts' "$FAKE_LOG")" "0" "…deno não foi chamado"
run with_fakes bash "$MIG/storage/run.sh" --step copy --only documents --dry-run
rc_is 0 "--dry-run dispensa confirmação"; has "ONLY=[documents] DRY=[1] step=copy-objects.ts" "flags viram ambiente do deno"
: > "$FAKE_LOG"
run with_fakes env FAKE_FAIL_STEP=create-buckets.ts bash "$MIG/storage/run.sh" --yes
rc_is 5 "step que falha devolve o código dele"
is "$(awk '{print $NF}' "$FAKE_LOG" | tr '\n' ' ')" "list-buckets.ts create-buckets.ts " "pipeline para no step que falhou (ordem list→create)"
: > "$FAKE_LOG"; run with_fakes bash "$MIG/storage/run.sh" --yes
is "$(awk '{print $NF}' "$FAKE_LOG" | tr '\n' ' ')" "list-buckets.ts create-buckets.ts copy-objects.ts verify-counts.ts " "ordem completa do pipeline"
falsy "chave service_role não vai para o argv do deno" grep -q "service_role" "$FAKE_LOG"
printf 'SRC_SUPABASE_URL=https://a.test # origem\nNOTA=duas palavras\n' > "$SE2"
run with_fakes bash "$MIG/storage/run.sh" --step list
rc_is 2 "variável obrigatória ausente (antes: export quebrava com '#')"; has "SRC_SERVICE_ROLE_KEY não definido" "diz qual falta"
run with_fakes bash "$MIG/storage/run.sh" --step xyz; rc_is 2 "--step inválido"

section "reset-passwords.sh (deno falso)"
fake_bin deno 'echo "{\"acao\":\"teste\"}"; exit "${FAKE_DENO_EXIT:-0}"'
RP=(env LOG_DIR="$T_TMP/logs" TARGET_SUPABASE_URL=https://refnovo.supabase.test TARGET_SERVICE_ROLE_KEY=chaveSEGREDO TARGET_SITE_URL=https://app.test HOME="$T_TMP" PATH="$T_FAKE:$PATH" bash "$MIG/reset-passwords.sh")
: > "$FAKE_LOG"; run "${RP[@]}" --dry-run
rc_is 0 "--dry-run não pede confirmação"; has "(dry-run)" "informa que é simulação"; is "$(grep -c -- '--execute' "$FAKE_LOG")" "0" "--dry-run nunca passa --execute"
run "${RP[@]}"
rc_is 2 "execução real sem confirmação é recusada"
: > "$FAKE_LOG"; run "${RP[@]/#env/env}" --limit 5 --yes
is "$(sed 's|.*reset-passwords.ts ||' "$FAKE_LOG")" "--limit 5 --execute" "real: repassa args e acrescenta --execute (contrato do .ts)"
hasnt "chaveSEGREDO" "chave não aparece na saída"
falsy "chave não vai para o argv nem para o log" grep -rq "chaveSEGREDO" "$FAKE_LOG" "$T_TMP/logs"
is "$(stat -c %a "$T_TMP"/logs/*.jsonl | sort -u)" "600" "log JSONL com permissão 600"
run env CONFIRM=refnovo.supabase.test "${RP[@]:1}"; rc_is 0 "CONFIRM=<host do projeto> confirma"
run env FAKE_DENO_EXIT=2 "${RP[@]:1}" --yes; rc_is 1 "falhas de envio (código 2 do .ts) → exit 1"; hasnt "Concluído" "não declara sucesso"
run "${RP[@]}" --dry-run --execute; rc_is 2 "--dry-run e --execute juntos"
run env LOG_DIR="$T_TMP/logs" DEST_SUPABASE_URL=https://x.test DEST_SERVICE_ROLE_KEY=k TARGET_SITE_URL=https://app.test HOME="$T_TMP" PATH="$T_FAKE:$PATH" bash "$MIG/reset-passwords.sh" --dry-run
rc_is 0 "DEST_* do env.example servem de TARGET_*"
run env LOG_DIR="$T_TMP/logs" HOME="$T_TMP" PATH="$T_FAKE:$PATH" bash "$MIG/reset-passwords.sh" --dry-run; rc_is 2 "sem variáveis: erro de configuração"
finish
