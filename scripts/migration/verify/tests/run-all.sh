#!/usr/bin/env bash
# run-all.sh — orquestra a suíte de cenários dos guards e agrega o resultado.
#
# Modos:
#   docker (default)   sobe um Postgres descartável ($PG_IMAGE) e, quando algum cenário
#                      pede CLUSTER=endurecido, um segundo com TLS + checksums + archive
#                      + wal_level=logical. Portas: GUARD_DOCKER_PORT / GUARD_DOCKER_HARD_PORT.
#   existente          USE_EXISTING_PG=1 (ou GUARD_PGHOST definido): usa um Postgres que já
#                      está de pé. Conexão: GUARD_PGHOST/GUARD_PGPORT/GUARD_PGUSER/
#                      GUARD_PGPASSWORD (cai para PGHOST/PGPORT/PGUSER/PGPASSWORD).
#                      Precisa de um papel que possa CREATE DATABASE; cenários que exigem
#                      config de cluster são marcados SKIP.
# Em ambos os modos cada cenário roda num banco próprio, criado e dropado pelo runner
# (prefixo GUARD_DB_PREFIX, default guardtest). O cluster em si nunca é reconfigurado.
#
# Uso:
#   ./run-all.sh                      todos os cenários
#   ./run-all.sh --only 04,11,14      só os de número 04, 11 e 14
#   ./run-all.sh --list               lista os cenários e sai
#   ./run-all.sh --keep-db            não dropa os bancos (depuração)
# Saída: $GUARD_OUT_DIR (default tests/out/): report-<UTC>.md, report-<UTC>.json e um
# .log por cenário. Código de saída: 0 = nenhum FAIL; 1 = algum FAIL; 2 = erro de uso/infra.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERIFY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
SCENARIOS_DIR="$SCRIPT_DIR/scenarios"
OUT_DIR="${GUARD_OUT_DIR:-$SCRIPT_DIR/out}"

ajuda() { sed -n '2,/^set -uo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; }
erro() { echo "✖ $*" >&2; exit 2; }

ONLY=""; SO_LISTAR=0; MANTER_DB=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only) [[ $# -ge 2 ]] || erro "--only exige uma lista (ex.: --only 04,11)"; ONLY="$2"; shift 2 ;;
    --only=*) ONLY="${1#*=}"; shift ;;
    --list) SO_LISTAR=1; shift ;;
    --keep-db) MANTER_DB=1; shift ;;
    -h|--help) ajuda; exit 0 ;;
    *) erro "arg desconhecido: $1 (veja --help)" ;;
  esac
done

shopt -s nullglob
CENARIOS=()
for f in "$SCENARIOS_DIR"/*.sh; do
  base="$(basename "$f" .sh)"; num="${base%%-*}"
  if [[ -n "$ONLY" && ",$ONLY," != *",$num,"* ]]; then continue; fi
  CENARIOS+=("$f")
done
[[ ${#CENARIOS[@]} -gt 0 ]] || erro "nenhum cenário selecionado (--only $ONLY)"

# Metadado declarado no topo do cenário, lido num subshell para não vazar nada.
# shellcheck disable=SC2034,SC1090 # defaults lidos por indireção (${!2}); cenário é dinâmico
meta() { ( EXPECTED_EXIT=0; CLUSTER=padrao; DOIS_LADOS=0
           source "$1" >/dev/null 2>&1; printf '%s' "${!2:-}" ); }

if [[ $SO_LISTAR -eq 1 ]]; then
  for f in "${CENARIOS[@]}"; do
    printf '%-52s cluster=%-10s esperado=%-7s dois_lados=%s\n' "$(basename "$f" .sh)" \
      "$(meta "$f" CLUSTER)" "$(meta "$f" EXPECTED_EXIT)" "$(meta "$f" DOIS_LADOS)"
  done
  exit 0
fi

command -v psql >/dev/null || erro "psql requerido"
if [[ "${USE_EXISTING_PG:-0}" == 1 || -n "${GUARD_PGHOST:-}" ]]; then GUARD_MODE=existente; else GUARD_MODE=docker; fi

mkdir -p "$OUT_DIR" || erro "não consegui criar $OUT_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_MD="$OUT_DIR/report-$STAMP.md"
REPORT_JSON="$OUT_DIR/report-$STAMP.json"
RUN_TMP="$(mktemp -d)"
ROWS_FILE="$RUN_TMP/rows.tsv"; : >"$ROWS_FILE"
RUN_ID="$(date -u +%H%M%S)$$"
DB_PREFIX="${GUARD_DB_PREFIX:-guardtest}"
SCN_TIMEOUT="${GUARD_SCENARIO_TIMEOUT:-180}"
: "${PG_IMAGE:=postgres:15-alpine}"

# Clusters: C_<campo>[padrao|endurecido]. Vazio em C_HOST = indisponível neste modo.
declare -A C_HOST=() C_PORT=() C_USER=() C_PASS=() C_SSL=() C_MOTIVO=()
declare -a CONTAINERS=() DBS_CRIADOS=()

psql_admin() { # psql_admin <cluster> <args...> — conecta no banco de manutenção
  local c="$1"; shift
  PGHOST="${C_HOST[$c]}" PGPORT="${C_PORT[$c]}" PGUSER="${C_USER[$c]}" PGPASSWORD="${C_PASS[$c]}" \
    PGSSLMODE="${C_SSL[$c]}" PGDATABASE="${GUARD_PGDATABASE:-postgres}" PGCONNECT_TIMEOUT=5 psql -X -q "$@"
}

# shellcheck disable=SC2329 # chamada pelo trap EXIT
limpa_tudo() {
  local item
  if [[ $MANTER_DB -eq 0 ]]; then
    for item in "${DBS_CRIADOS[@]:-}"; do
      [[ -n "$item" ]] || continue
      psql_admin "${item%%:*}" -c "DROP DATABASE IF EXISTS \"${item#*:}\" WITH (FORCE)" >/dev/null 2>&1
    done
  fi
  for item in "${CONTAINERS[@]:-}"; do [[ -n "$item" ]] && docker rm -f -v "$item" >/dev/null 2>&1; done
  rm -rf "$RUN_TMP"
}
trap limpa_tudo EXIT
trap 'echo "✖ interrompido" >&2; exit 130' INT TERM

espera_pg() { # espera_pg <cluster> <cid> — até 60s; falha se o container morrer
  local i
  for (( i = 0; i < 120; i++ )); do
    psql_admin "$1" -Atc "SELECT 1" >/dev/null 2>&1 && return 0
    [[ -n "${2:-}" && -z "$(docker ps -q --no-trunc --filter "id=$2")" ]] && return 1
    sleep 0.5
  done
  return 1
}

FLAGS_BASE=(-c shared_preload_libraries=pg_stat_statements -c max_prepared_transactions=10)

# O pg_hba da imagem só aceita replicação vinda de dentro do container; os cenários que
# sobem um walsender (pg_receivewal) conectam pela porta publicada.
libera_replicacao() { # libera_replicacao <cluster> <cid>
  docker exec "$2" sh -c 'echo "host replication all all scram-sha-256" >>"$PGDATA/pg_hba.conf"' >/dev/null 2>&1
  psql_admin "$1" -c "SELECT pg_reload_conf()" >/dev/null 2>&1
  return 0
}

sobe_docker_padrao() {
  local porta="${GUARD_DOCKER_PORT:-54329}" cid
  echo "▶ subindo sandbox padrão ($PG_IMAGE, porta $porta)"
  cid=$(docker run -d -e POSTGRES_PASSWORD=guard -p "127.0.0.1:$porta:5432" "$PG_IMAGE" "${FLAGS_BASE[@]}") \
    || erro "docker run falhou (imagem ausente? porta $porta ocupada?). Alternativa: USE_EXISTING_PG=1"
  CONTAINERS+=("$cid")
  C_HOST[padrao]=127.0.0.1; C_PORT[padrao]=$porta; C_USER[padrao]=postgres; C_PASS[padrao]=guard; C_SSL[padrao]=prefer
  espera_pg padrao "$cid" || { docker logs "$cid" 2>&1 | tail -5 >&2; erro "sandbox padrão não respondeu"; }
  libera_replicacao padrao "$cid"
}

sobe_docker_endurecido() { # TLS + checksums + archive + wal_level=logical
  local porta="${GUARD_DOCKER_HARD_PORT:-54330}" cid certs="$RUN_TMP/certs"
  command -v openssl >/dev/null || { C_MOTIVO[endurecido]="openssl ausente (precisa gerar o certificado)"; return 1; }
  echo "▶ subindo sandbox endurecido ($PG_IMAGE, porta $porta)"
  mkdir -p "$certs"
  openssl req -new -x509 -days 2 -nodes -subj /CN=guard-sandbox \
    -out "$certs/server.crt" -keyout "$certs/server.key" >/dev/null 2>&1 \
    || { C_MOTIVO[endurecido]="openssl não gerou o certificado"; return 1; }
  cid=$(docker create -e POSTGRES_PASSWORD=guard -e POSTGRES_INITDB_ARGS=--data-checksums \
    -p "127.0.0.1:$porta:5432" "$PG_IMAGE" sh -c 'cp /certs/server.* /var/lib/postgresql/ &&
      chown postgres:postgres /var/lib/postgresql/server.* && chmod 600 /var/lib/postgresql/server.key &&
      exec docker-entrypoint.sh postgres "$@"' sh "${FLAGS_BASE[@]}" \
      -c ssl=on -c ssl_cert_file=/var/lib/postgresql/server.crt -c ssl_key_file=/var/lib/postgresql/server.key \
      -c wal_level=logical -c archive_mode=on) \
    || { C_MOTIVO[endurecido]="docker create falhou"; return 1; }
  CONTAINERS+=("$cid")
  if ! docker cp "$certs" "$cid":/certs >/dev/null || ! docker start "$cid" >/dev/null; then
    C_MOTIVO[endurecido]="docker cp/start falhou"; return 1
  fi
  C_HOST[endurecido]=127.0.0.1; C_PORT[endurecido]=$porta; C_USER[endurecido]=postgres; C_PASS[endurecido]=guard; C_SSL[endurecido]=require
  espera_pg endurecido "$cid" || { C_HOST[endurecido]=""; C_MOTIVO[endurecido]="sandbox endurecido não respondeu"; return 1; }
  # archive_command vai por ALTER SYSTEM (e não por -c) para um cenário poder trocá-lo e desfazer.
  psql_admin endurecido -c "ALTER SYSTEM SET archive_command = '/bin/true'" -c "SELECT pg_reload_conf()" >/dev/null
  libera_replicacao endurecido "$cid"
}

if [[ $GUARD_MODE == docker ]]; then
  command -v docker >/dev/null || erro "docker requerido no modo padrão. Alternativa: USE_EXISTING_PG=1 (veja --help)"
  docker info >/dev/null 2>&1 || erro "daemon do docker indisponível. Alternativa: USE_EXISTING_PG=1 (veja --help)"
  sobe_docker_padrao
else
  C_HOST[padrao]="${GUARD_PGHOST:-${PGHOST:-127.0.0.1}}"; C_PORT[padrao]="${GUARD_PGPORT:-${PGPORT:-5432}}"
  C_USER[padrao]="${GUARD_PGUSER:-${PGUSER:-postgres}}";  C_PASS[padrao]="${GUARD_PGPASSWORD:-${PGPASSWORD:-}}"
  C_SSL[padrao]="${PGSSLMODE:-prefer}"
  C_MOTIVO[endurecido]="exige sandbox Docker (cluster endurecido: TLS/checksums/archive/wal_level)"
  echo "▶ usando Postgres existente em ${C_HOST[padrao]}:${C_PORT[padrao]} (usuário ${C_USER[padrao]})"
  psql_admin padrao -Atc "SELECT 1" >/dev/null 2>&1 || erro "não conectei em ${C_HOST[padrao]}:${C_PORT[padrao]} — confira GUARD_PG*/PG*"
fi

garante_cluster() { # 0 se o cluster pedido está disponível (sobe o endurecido sob demanda)
  [[ -n "${C_HOST[$1]:-}" ]] && return 0
  [[ "$1" == endurecido && $GUARD_MODE == docker && -z "${C_MOTIVO[endurecido]:-}" ]] && sobe_docker_endurecido && return 0
  return 1
}

linha() { printf '%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" "$5" >>"$ROWS_FILE"; } # status nome esperado observado log

avalia() { # avalia <esperado> <observado> → PASS|FAIL
  if [[ "$1" == nonzero ]]; then [[ "$2" -ne 0 ]] && echo PASS || echo FAIL
  else [[ "$2" -eq "$1" ]] && echo PASS || echo FAIL; fi
}

# Corpo do cenário — SEMPRE dentro de um subshell: função, variável ou EXPECTED_EXIT de um
# cenário nunca vaza para o seguinte, e `set -e` nunca fica ligado no runner.
executa_cenario() {
  local f="$1" name="$2" log="$OUT_DIR/$2.log" obs motivo
  set +e
  EXPECTED_EXIT=0; DOIS_LADOS=0
  # shellcheck source=lib.sh
  source "$SCRIPT_DIR/lib.sh"
  # shellcheck disable=SC1090
  source "$f"
  finaliza() { { declare -F cleanup_scenario >/dev/null && cleanup_scenario; bg_fecha_todas; } >>"$log" 2>&1; }
  trap 'finaliza; exit 124' TERM
  : >"$log"
  if declare -F requires >/dev/null && ! motivo="$(requires 2>&1)"; then
    linha SKIP "$name" "$EXPECTED_EXIT" "-" "${motivo//$'\n'/ }"; return 0
  fi
  declare -F run_guard >/dev/null || { linha FAIL "$name" "$EXPECTED_EXIT" "-" "cenário sem run_guard()"; return 0; }
  if [[ "$DOIS_LADOS" == 1 ]]; then
    if declare -F setup_ok >/dev/null && ! setup_ok >>"$log" 2>&1; then
      linha FAIL "$name [limpo]" 0 "-" "setup_ok falhou — out/$name.log"; finaliza; return 0
    fi
    echo "── lado limpo ──" >>"$log"
    if declare -F run_guard_ok >/dev/null; then run_guard_ok >>"$log" 2>&1; else run_guard >>"$log" 2>&1; fi
    obs=$?
    linha "$(avalia 0 "$obs")" "$name [limpo]" 0 "$obs" "out/$name.log"
    echo "── lado plantado ──" >>"$log"
  fi
  if declare -F setup >/dev/null && ! setup >>"$log" 2>&1; then
    linha FAIL "$name" "$EXPECTED_EXIT" "-" "setup falhou — out/$name.log"; finaliza; return 0
  fi
  run_guard >>"$log" 2>&1; obs=$?
  finaliza
  linha "$(avalia "$EXPECTED_EXIT" "$obs")" "$name" "$EXPECTED_EXIT" "$obs" "out/$name.log"
}

run_one() {
  local f="$1" seq="$2" name cluster db antes pid vigia rc
  name="$(basename "$f" .sh)"
  cluster="$(meta "$f" CLUSTER)"; cluster="${cluster:-padrao}"
  if ! garante_cluster "$cluster"; then
    linha SKIP "$name" "$(meta "$f" EXPECTED_EXIT)" "-" "${C_MOTIVO[$cluster]:-cluster $cluster indisponível}"; return 0
  fi
  db="${DB_PREFIX}_${RUN_ID}_${seq}"
  if ! psql_admin "$cluster" -c "CREATE DATABASE \"$db\"" >/dev/null 2>"$RUN_TMP/createdb.err"; then
    linha FAIL "$name" "-" "-" "CREATE DATABASE falhou: $(tr '\n' ' ' <"$RUN_TMP/createdb.err")"; return 0
  fi
  DBS_CRIADOS+=("$cluster:$db")
  antes=$(wc -l <"$ROWS_FILE")
  (
    export PGHOST="${C_HOST[$cluster]}" PGPORT="${C_PORT[$cluster]}" PGUSER="${C_USER[$cluster]}" \
           PGPASSWORD="${C_PASS[$cluster]}" PGSSLMODE="${C_SSL[$cluster]}" PGDATABASE="$db" PGCONNECT_TIMEOUT=5
    export SCRIPT_DIR VERIFY_DIR REPO_ROOT GUARD_MODE SCN_ID="gt${RUN_ID}n${seq}"
    export SCN_TMP="$RUN_TMP/scn-$seq"; mkdir -p "$SCN_TMP"
    trap - EXIT
    executa_cenario "$f" "$name"
  ) &
  pid=$!
  ( sleep "$SCN_TIMEOUT"; kill -TERM "$pid" 2>/dev/null ) >/dev/null 2>&1 &
  vigia=$!
  wait "$pid"; rc=$?
  kill "$vigia" 2>/dev/null; wait "$vigia" 2>/dev/null
  if [[ $(wc -l <"$ROWS_FILE") -eq $antes || $rc -eq 124 ]]; then
    linha FAIL "$name" "-" "-" "cenário abortou (rc=$rc; limite ${SCN_TIMEOUT}s) — out/$name.log"
  fi
  if [[ $MANTER_DB -eq 0 ]]; then
    psql_admin "$cluster" -c "DROP DATABASE IF EXISTS \"$db\" WITH (FORCE)" >/dev/null 2>&1
  fi
  rm -rf "$RUN_TMP/scn-$seq"
}

seq=0
for f in "${CENARIOS[@]}"; do
  seq=$((seq + 1))
  echo "▶ $(basename "$f" .sh)"
  run_one "$f" "$seq"
done

json_str() { local s="${1//\\/\\\\}"; s="${s//\"/\\\"}"; s="${s//$'\t'/ }"; printf '"%s"' "$s"; }

PASS=0; FAIL=0; SKIP=0; JSON_ROWS=""
{
  echo "# Guard Validation Report — $STAMP"
  echo
  echo "Modo: \`$GUARD_MODE\` · imagem: \`$([[ $GUARD_MODE == docker ]] && echo "$PG_IMAGE" || echo n/a)\`"
  echo
  echo "| stat | scenario | expected | observed | log / motivo |"
  echo "| ---- | -------- | -------- | -------- | ------------ |"
  while IFS=$'\t' read -r st nome esp obs det; do
    case "$st" in PASS) PASS=$((PASS + 1)) ;; FAIL) FAIL=$((FAIL + 1)) ;; SKIP) SKIP=$((SKIP + 1)) ;; esac
    printf '| %s | %s | %s | %s | %s |\n' "$st" "$nome" "$esp" "$obs" "${det//|/\\|}"
    JSON_ROWS+="${JSON_ROWS:+,}{\"scenario\":$(json_str "$nome"),\"expected\":$(json_str "$esp"),\"observed\":$(json_str "$obs"),\"status\":$(json_str "$st"),\"detail\":$(json_str "$det")}"
  done <"$ROWS_FILE"
  echo
  echo "**Total:** $((PASS + FAIL + SKIP)) — ✅ $PASS PASS · ❌ $FAIL FAIL · ⏭ $SKIP SKIP"
} >"$REPORT_MD"

printf '{"stamp":"%s","mode":"%s","pass":%d,"fail":%d,"skip":%d,"scenarios":[%s]}\n' \
  "$STAMP" "$GUARD_MODE" "$PASS" "$FAIL" "$SKIP" "$JSON_ROWS" >"$REPORT_JSON"

echo
awk -F'\t' '$1=="FAIL"{printf "  ❌ %s — esperado %s, observado %s (%s)\n",$2,$3,$4,$5}' "$ROWS_FILE"
awk -F'\t' '$1=="SKIP"{printf "  ⏭ %s — %s\n",$2,$5}' "$ROWS_FILE"
echo "═════════════════════════════════════════════"
echo " ✅ $PASS · ❌ $FAIL · ⏭ $SKIP — relatório: $REPORT_MD"
echo "═════════════════════════════════════════════"
[[ "$FAIL" -eq 0 ]] && exit 0
exit 1
