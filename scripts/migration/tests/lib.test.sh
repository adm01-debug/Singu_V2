#!/usr/bin/env bash
# lib.test.sh — unidade de _lib.sh: leitor de .env sem execução, senha fora do
# argv, redação de segredos, aliases e confirmação. Não precisa de banco.
# shellcheck disable=SC2016  # trechos em aspas simples rodam num bash filho (libq)
# shellcheck source-path=SCRIPTDIR source=lib/harness.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/harness.sh"
L="$MIG/_lib.sh"
# libq <trecho bash> — roda o trecho num bash limpo com a lib carregada
libq() { run env -i PATH="$PATH" HOME="$T_TMP" T="$T_TMP" EXTRA="${EXTRA:-}" CONFIRM="${CONFIRM_T:-}" bash -c "set -euo pipefail; source '$L'; $1"; }

section "mig_load_env: lê KEY=VALUE sem executar nada"
cat > "$T_TMP/e.env" <<'ENVEOF'
# comentário
SIMPLES=abc
COM_COMENTARIO=valor   # explicação
ASPAS_DUPLAS="dois termos" # fim
ASPAS_SIMPLES='q#r $x'
export EXPORTADA=1
URL=__URL_COM_AMPERSAND__
PERIGO=$(touch "$T/pwn-subst")
PERIGO2=`touch "$T/pwn-crase`
; touch "$T/pwn-linha"
VAZIA=
COM_CR=valor
  IDENTADA=ok
1INVALIDA=x
ENVEOF
URL_AMP="$(pgurl u p 'h/db?sslmode=require&application_name=x')"
sed -i "s|__URL_COM_AMPERSAND__|${URL_AMP//&/\\&}|" "$T_TMP/e.env"
printf 'COM_CR=valor\r\nULTIMA_SEM_NL=fim' >> "$T_TMP/e.env"
libq 'mig_load_env "$T/e.env"; printf "%s|" "$SIMPLES" "$COM_COMENTARIO" "$ASPAS_DUPLAS" "$ASPAS_SIMPLES" "$EXPORTADA" "$URL" "$VAZIA" "$COM_CR" "$IDENTADA" "$ULTIMA_SEM_NL"'
is "$OUT" "abc|valor|dois termos|q#r \$x|1|${URL_AMP}||valor|ok|fim|" "valores lidos literalmente (aspas, comentário inline, &, CRLF, última linha sem \\n)"
falsy "\$(...) do arquivo NÃO é executado" test -e "$T_TMP/pwn-subst"
falsy "crase do arquivo NÃO é executada" test -e "$T_TMP/pwn-crase"
falsy "linha de comando no arquivo NÃO é executada" test -e "$T_TMP/pwn-linha"
libq 'mig_load_env "$T/e.env"; echo "${PERIGO}"'
has 'touch' "valor com \$( ) fica como texto"
libq 'SIMPLES=do-ambiente; mig_load_env "$T/e.env"; echo "$SIMPLES"'
is "$OUT" "do-ambiente" "variável do ambiente vence a do arquivo"
libq 'SIMPLES=""; mig_load_env "$T/e.env"; echo "[$SIMPLES]"'
is "$OUT" "[]" "variável definida vazia no ambiente também vence"
libq 'mig_load_env "$T/nao-existe.env" "$T/e.env"; echo "$SIMPLES"'
is "$OUT" "abc" "arquivo ausente é ignorado; o seguinte é lido"
printf 'SIMPLES=segundo\nSO_NO_SEGUNDO=1\n' > "$T_TMP/f.env"
libq 'mig_load_env "$T/e.env" "$T/f.env"; echo "$SIMPLES $SO_NO_SEGUNDO"'
is "$OUT" "abc 1" "primeiro arquivo vence o segundo"
libq 'mig_load_env "$T/e.env"; declare -p 1INVALIDA 2>&1 | grep -c "not found"'
is "$OUT" "1" "nome inválido é ignorado"

section "mig_pg/mig_pg_split: senha sai da URL e vai para PGPASSWORD do filho"
cat > "$T_FAKE/psql" <<'FEOF'
#!/usr/bin/env bash
printf 'ARGV=%s\n' "$*"; printf 'PW=%s\n' "${PGPASSWORD-<unset>}"
FEOF
chmod +x "$T_FAKE/psql"
libq "PATH='$T_FAKE':\$PATH; mig_psql '$(pgurl user "${T_PW_ENC}%27" 'db.host:5432/app?sslmode=require')' -Atc 'select 1'"
has "ARGV=-d postgresql://user@db.host:5432/app?sslmode=require -Atc select 1" "URL passada sem a senha"
has "PW=p@ss w0rd\$%'" "senha percent-decodificada em PGPASSWORD"
hasnt "p%40ss" "senha codificada não aparece no argv"
libq "PATH='$T_FAKE':\$PATH; mig_psql '$(pgurl u 'barra%5Cinvertida' h/d postgres)' -c x"
has 'PW=barra\invertida' "barra invertida na senha preservada"
libq "PATH='$T_FAKE':\$PATH; PGPASSWORD=do-ambiente mig_psql 'postgresql://user@h/d' -c x"
has "PW=do-ambiente" "URL sem senha mantém o PGPASSWORD do ambiente"
has "ARGV=-d postgresql://user@h/d -c x" "URL sem senha passa intacta"
libq "PATH='$T_FAKE':\$PATH; mig_psql 'host=h dbname=d user=u' -c x"
has "ARGV=-d host=h dbname=d user=u -c x" "conninfo keyword=value passa intacto"
libq "PATH='$T_FAKE':\$PATH; mig_psql '$(pgurl u s3nh4 h/d)' -c x >/dev/null; echo \"fora=[\${PGPASSWORD-unset}]\""
has "fora=[unset]" "PGPASSWORD não vaza para o shell chamador"
libq "mig_pg_split '$(pgurl u a:b h/d)'; echo \"\$MIG_PG_URL [\$MIG_PG_PASSWORD]\""
is "$OUT" "postgresql://u@h/d [a:b]" "senha com ':' é preservada"
libq "mig_target '$(pgurl u p 'db.x.co:6543/postgres?sslmode=require')'"
is "$OUT" "db.x.co:6543/postgres" "mig_target não mostra credenciais nem query string"
libq 'mig_target "https://ref.supabase.co"'
is "$OUT" "ref.supabase.co" "mig_target de URL http"

section "mig_redact: URLs com senha, JWT e tokens saem mascarados"
libq "echo 'falha em $(pgurl postgres Sup3rSecreta db.x.supabase.co:5432/postgres) e $T_JWT token $T_SBP $T_SBSECRET Authorization: Bearer abcDEF123456.xyz' | mig_redact"
hasnt "Sup3rSecreta" "senha da URL mascarada"
hasnt "$T_JWT_HEAD" "JWT mascarado"
hasnt "${T_SBP:0:14}" "token sbp_ mascarado"
hasnt "${T_SBSECRET:10:16}" "sb_secret_ mascarado"
hasnt "abcDEF123456" "Bearer mascarado"
has "db.x.supabase.co:5432/postgres" "host continua legível"
libq 'echo "linha comum sem segredo 12345" | mig_redact'
is "$OUT" "linha comum sem segredo 12345" "texto normal não é alterado"

section "mig_alias, mig_need, mig_confirm, mig_opt_arg"
libq 'SOURCE_DB_URL=legado; mig_alias SRC_DB_URL SOURCE_DB_URL; echo "$SRC_DB_URL"'
is "$OUT" "legado" "nome legado preenche o canônico"
libq 'SRC_DB_URL=a; SOURCE_DB_URL=a; mig_alias SRC_DB_URL SOURCE_DB_URL; echo ok'
is "$OUT" "ok" "valores iguais nos dois nomes são aceitos"
libq 'SRC_DB_URL=a; SOURCE_DB_URL=b; mig_alias SRC_DB_URL SOURCE_DB_URL; echo nao-chega'
rc_is 2 "valores diferentes nos dois nomes abortam"
hasnt "nao-chega" "aborta antes de continuar"
libq 'mig_need bash binario-que-nao-existe-xyz outro-ausente'
rc_is 2 "mig_need aborta com dependência ausente"
has "binario-que-nao-existe-xyz outro-ausente" "lista todas as ausentes"
libq 'mig_confirm "x" alvo; echo passou'
rc_is 2 "sem terminal e sem confirmação: aborta"
hasnt "passou" "não prossegue"
libq 'MIG_YES=1; mig_confirm "x" alvo; echo passou'
has "passou" "--yes (MIG_YES=1) confirma"
CONFIRM_T=alvo libq 'mig_confirm "x" alvo; echo passou'
has "passou" "CONFIRM=<alvo> confirma"
CONFIRM_T=outro libq 'mig_confirm "x" alvo; echo passou'
rc_is 2 "CONFIRM de outro alvo é recusado"
CONFIRM_T=""
libq 'mig_opt_arg --only 1'
rc_is 2 "flag sem valor é erro de uso"
libq 'mig_is_uint 12 && ! mig_is_uint -1 && ! mig_is_uint 1x && ! mig_is_uint "" && echo ok'
is "$OUT" "ok" "mig_is_uint"
finish
