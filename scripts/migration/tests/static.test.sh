#!/usr/bin/env bash
# static.test.sh — checagens estáticas do grupo: sintaxe, shellcheck, modo
# estrito, --help, senha fora do argv, documentação de variáveis de ambiente,
# skip-tables × DDL real e template de secrets × código. Não precisa de banco.
# shellcheck source-path=SCRIPTDIR source=lib/harness.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/harness.sh"
cd "$MIG" || exit 1
mapfile -t SCRIPTS < <(g6_scripts)

section "sintaxe, modo estrito e shellcheck (${#SCRIPTS[@]} scripts)"
is "$(( ${#SCRIPTS[@]} >= 31 ))" 1 "inventário do grupo tem >= 31 scripts shell"
for s in "${SCRIPTS[@]}"; do
  truthy "bash -n $s" bash -n "$s"
  [[ "$s" == "_lib.sh" ]] && continue
  truthy "$s usa set -euo pipefail" grep -q '^set -euo pipefail' "$s"
  truthy "$s começa com shebang bash" bash -c "head -n 1 '$s' | grep -q '^#!/usr/bin/env bash'"
done
if command -v shellcheck >/dev/null 2>&1; then
  run shellcheck -x "${SCRIPTS[@]}" tests/*.sh tests/lib/*.sh
  rc_is 0 "shellcheck -x sem nenhum aviso nos scripts e nos testes"
else
  echo "    (shellcheck ausente — checagem pulada)"
fi
truthy "node --check dr/create-drill-backup.mjs" node --check dr/create-drill-backup.mjs

section "--help de todo script sai 0, explica e não exige ambiente"
for s in "${SCRIPTS[@]}"; do
  [[ "$s" == "_lib.sh" ]] && continue
  run env -i PATH="$PATH" HOME="$T_TMP" bash "$s" --help
  if [[ "$RC" == "0" && ${#OUT} -gt 80 ]]; then ok "$s --help"; else fail "$s --help (exit $RC, ${#OUT} caracteres)"; fi
  if [[ "$OUT" == *"Exit"* || "$OUT" == *"exit"* || "$s" == "auth/rotate-jwt.sh" ]]; then ok "$s documenta códigos de saída"; else fail "$s --help não documenta códigos de saída"; fi
done
run env -i PATH="$PATH" node dr/create-drill-backup.mjs --help
rc_is 0 "create-drill-backup.mjs --help"

section "argumento desconhecido é erro de uso (exit 2), nunca execução"
for s in export-data.sh import-data.sh import-data-parallel.sh compare-counts.sh dashboard.sh rollback.sh \
         cutover/freeze-origin.sh functions/deploy-all.sh functions/set-secrets.sh functions/verify-deploy.sh \
         rollback/full-restore.sh storage/run.sh cdc/drain.sh cdc/lag-watch.sh dr/wal-archive-check.sh; do
  run bash "$s" --opcao-que-nao-existe
  rc_is 2 "$s rejeita flag desconhecida"
done

section "senha nunca vai para o argv: nenhum psql/pg_* recebe a URL crua"
# toda conexão passa por mig_psql/mig_pg/pgc (senha em PGPASSWORD do filho)
bad="$(grep -nE '(^|[^_a-z])(psql|pg_restore|pg_dump|pg_recvlogical)[^|;]*"\$\{?[A-Z_]*(DB_URL)' "${SCRIPTS[@]}" | grep -vE 'mig_psql|mig_pg |pgc |echo|log |mig_log|#|:-- ' || true)"
is "$bad" "" "nenhuma chamada direta com *_DB_URL no argv"
bad="$(grep -nE 'curl[^|]*-H[[:space:]]*"(Authorization|apikey)' "${SCRIPTS[@]}" || true)"
is "$bad" "" "nenhum curl com segredo em -H na linha de comando"
bad="$(grep -nE '^[^#]*(source|\.)[[:space:]]+"?\$[A-Z_{}/]*\.?env' "${SCRIPTS[@]}" || true)"
is "$bad" "" "nenhum script dá source em arquivo .env (usa leitor seguro)"
bad="$(grep -nE '/tmp/[A-Za-z]' "${SCRIPTS[@]}" | grep -vE '^[^:]+:[0-9]+:[[:space:]]*#' || true)"
is "$bad" "" "nenhum caminho fixo em /tmp"

section "variáveis de ambiente: lidas pelos scripts ⇔ documentadas nos exemplos"
INTERNAS=" CURRENT REF RESTORE_LOG TMP_DUMP SNAP_PID MIG_TAG MIG_YES MIG_PG_PASSWORD HOME XDG_STATE_HOME "
documented() { grep -hoE '^#?[[:space:]]*[A-Z][A-Z0-9_]*=' env.example storage/env.example | tr -d '#= \t'; grep -oE 'PG[A-Z]+=' env.example | tr -d '='; }
DOCS="$(documented | LC_ALL=C sort -u)"
READS="$(bash tests/lib/env-reads.sh "${SCRIPTS[@]}" dr/create-drill-backup.mjs)"
faltando=""
for v in $READS; do
  [[ "$INTERNAS" == *" $v "* ]] && continue
  grep -qx "$v" <<<"$DOCS" || faltando+="$v "
done
is "$faltando" "" "toda variável lida por script do grupo está em env.example/storage/env.example"
sobrando=""
for v in $DOCS; do
  grep -rqw --include='*.sh' --include='*.mjs' --include='*.ts' --include='*.sql' --exclude-dir=tests -e "$v" . || sobrando+="$v "
done
is "$sobrando" "" "toda variável dos exemplos é lida por algum script do kit"
# scripts de outros grupos (.ts, verify/): só avisa, não reprova
outros="$(find . \( -name '*.ts' -o -path './verify/*.sh' \) -not -name '*_test.ts' -not -name '_mock*' -not -name '_pg_teste*' -print0 | xargs -0 bash tests/lib/env-reads.sh)"
aviso=""
for v in $outros; do grep -qx "$v" <<<"$DOCS" || aviso+="$v "; done
[[ -z "$aviso" ]] || echo "    (aviso: variáveis lidas por scripts de outros grupos e ainda fora do env.example: $aviso)"

section "secrets.template.env ⇔ código das edge functions"
run bash functions/preflight-secrets.sh
rc_is 0 "preflight-secrets.sh verde no repositório (todo secret lido está no template)"
for v in BITRIX24_WEBHOOK_SECRET EVOLUTION_API_SECRET LUX_WEBHOOK_SECRET CRON_SECRET; do
  truthy "template declara $v" grep -q "^$v=" functions/secrets.template.env
done
falsy "template não traz valor preenchido" grep -qE '^[A-Z0-9_]+=.+' functions/secrets.template.env
extras=""
while IFS= read -r v; do
  grep -rqw --include='*.ts' -e "$v" "$REPO/supabase/functions" || extras+="$v "
done < <(grep -oE '^[A-Z0-9_]+' functions/secrets.template.env)
is "$extras" "" "toda variável do template aparece em supabase/functions"
run bash functions/secrets-leak-scan.sh
rc_is 0 "secrets-leak-scan.sh verde no repositório"

section "skip-tables.txt e table-order.sql alinhados ao schema real (ddl/02 + ddl/11)"
REAL="$( { grep -oE '^CREATE TABLE public\.("[^"]+"|[a-z_0-9]+)' ddl/02_tables.sql | sed 's/.*public\.//; s/"//g'
           grep -oE 'PARTITION OF public\.[a-z_0-9]+' ddl/11_partitions.sql | sed 's/.*public\.//'
           grep -oE '^CREATE TABLE public\.[a-z_0-9]+ PARTITION' ddl/11_partitions.sql | awk '{print $3}' | sed 's/public\.//'; } | LC_ALL=C sort -u)"
is "$(( $(wc -l <<<"$REAL") > 100 ))" 1 "consegui ler as tabelas do DDL real"
orfas=""
while IFS= read -r pat || [[ -n "$pat" ]]; do
  [[ -z "$pat" || "$pat" =~ ^[[:space:]]*# ]] && continue
  achou=0
  # shellcheck disable=SC2053  # curinga intencional
  while IFS= read -r t; do if [[ "$t" == $pat ]]; then achou=1; break; fi; done <<<"$REAL"
  (( achou )) || orfas+="$pat "
done < skip-tables.txt
is "$orfas" "" "toda entrada da skip-list corresponde a tabela que existe no DDL"
is "$(tail -c 1 skip-tables.txt | od -An -c | tr -d ' ')" '\n' "skip-tables.txt termina com quebra de linha"
truthy "table-order.sql não lista tabelas fixas (ordem vem do catálogo)" bash -c "! grep -qE '^-- table: ' table-order.sql"

section "arquivos sensíveis ignorados pelo git"
for f in .env env.migration data/x.csv.gz logs/a.jsonl freeze-state/x/privileges.sql functions/secrets.env storage/.env cdc/out/w.json dr/out/x.md auth/.rotate-state.json.prepared; do
  truthy "$f está no .gitignore" git -C "$MIG" check-ignore -q "$f"
done
finish
