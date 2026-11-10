#!/usr/bin/env bash
# lib.sh — funções de apoio dos cenários (carregado pelo run-all.sh dentro do
# subshell de cada cenário). Não executa nada sozinho.
#
# Variáveis que o runner entrega ao cenário:
#   SCRIPT_DIR  diretório tests/ (contrato antigo: "$SCRIPT_DIR/../<guard>.sql")
#   VERIFY_DIR  scripts/migration/verify      REPO_ROOT  raiz do repositório
#   SCN_TMP     diretório temporário só deste cenário (apagado no fim)
#   SCN_ID      token único (use em nomes de objetos de cluster: slots, roles)
#   PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE  banco descartável do cenário
#   GUARD_MODE  docker | existente

# guard <arquivo.sql> [args do psql] — roda um guard como o CI roda.
guard() {
  local arquivo="$1"; shift
  psql -X -v ON_ERROR_STOP=1 "$@" -f "$VERIFY_DIR/$arquivo"
}

# sql "<comandos>" — executa SQL de preparo; falha derruba o setup.
sql() { psql -X -q -v ON_ERROR_STOP=1 -c "$1" >/dev/null; }

# sql_at "<consulta>" — devolve o resultado cru (sem cabeçalho).
sql_at() { psql -X -q -At -v ON_ERROR_STOP=1 -c "$1"; }

# db_url [banco] — URL de conexão sem senha (a senha vai por PGPASSWORD).
db_url() { printf 'postgresql://%s@%s:%s/%s' "$PGUSER" "$PGHOST" "$PGPORT" "${1:-$PGDATABASE}"; }

# config <guc> — valor atual de um GUC.
config() { sql_at "SELECT current_setting('$1', true)"; }

# exige_config <guc> <valor> — para usar em requires(): 0 se bate, senão explica e devolve 1.
exige_config() {
  local atual; atual="$(config "$1")"
  [[ "$atual" == "$2" ]] && return 0
  echo "exige $1=$2 (cluster tem '$atual')"; return 1
}

# exige_extensao_disponivel <nome> — a extensão precisa estar instalável no servidor.
exige_extensao_disponivel() {
  [[ "$(sql_at "SELECT count(*) FROM pg_available_extensions WHERE name='$1'")" == 1 ]] && return 0
  echo "extensão $1 não está disponível no servidor"; return 1
}

# exige_pgss_carregado — pg_stat_statements em shared_preload_libraries.
exige_pgss_carregado() {
  [[ "$(config shared_preload_libraries)" == *pg_stat_statements* ]] && return 0
  echo "exige pg_stat_statements em shared_preload_libraries"; return 1
}

# espera_ate "<consulta booleana>" [segundos] — polling até a consulta devolver t.
espera_ate() {
  local limite=$(( ${2:-10} * 5 )) i
  for (( i = 0; i < limite; i++ )); do
    [[ "$(psql -X -q -At -c "$1" 2>/dev/null)" == t ]] && return 0
    sleep 0.2
  done
  echo "tempo esgotado esperando: $1" >&2
  return 1
}

# ── Sessões em segundo plano (para plantar locks, transações abertas etc.) ──
declare -A _BG_PID=() _BG_FD=()

# bg_abre <nome> [VAR=valor ...] — abre um psql que fica vivo lendo de um FIFO.
bg_abre() {
  local nome="$1"; shift
  local fifo="$SCN_TMP/bg-$nome.fifo" fd
  mkfifo "$fifo"
  env PGAPPNAME="guardtest-$nome" "$@" psql -X -q <"$fifo" >"$SCN_TMP/bg-$nome.log" 2>&1 &
  _BG_PID[$nome]=$!
  exec {fd}>"$fifo"
  _BG_FD[$nome]=$fd
}

# bg_envia <nome> "<sql>" — manda uma linha para a sessão (não espera o resultado).
bg_envia() { printf '%s\n' "$2" >&"${_BG_FD[$1]}"; }

# bg_fecha <nome> — encerra a sessão (EOF; se não sair, mata).
bg_fecha() {
  local nome="$1" fd="${_BG_FD[$1]:-}" pid="${_BG_PID[$1]:-}" i
  [[ -n "$fd" ]] && eval "exec ${fd}>&-"
  if [[ -n "$pid" ]]; then
    for (( i = 0; i < 10; i++ )); do kill -0 "$pid" 2>/dev/null || break; sleep 0.1; done
    kill -TERM "$pid" 2>/dev/null
    wait "$pid" 2>/dev/null
  fi
  unset "_BG_FD[$nome]" "_BG_PID[$nome]"
  return 0
}

# bg_fecha_todas — rede de segurança chamada pelo runner ao fim do cenário.
bg_fecha_todas() { local n; for n in "${!_BG_PID[@]}"; do bg_fecha "$n"; done; return 0; }

# ── Dublês de comandos (psql/dig falsos via PATH) ──
# dubla <comando> — cria $SCN_TMP/bin/<comando> com o corpo lido do stdin e o põe no PATH.
dubla() {
  mkdir -p "$SCN_TMP/bin"
  { echo '#!/usr/bin/env bash'; cat; } >"$SCN_TMP/bin/$1"
  chmod +x "$SCN_TMP/bin/$1"
  case ":$PATH:" in *":$SCN_TMP/bin:"*) ;; *) PATH="$SCN_TMP/bin:$PATH" ;; esac
}

# espera_saida <codigo_esperado> <comando...> — roda e compara o código de saída.
espera_saida() {
  local esperado="$1" rc; shift
  "$@"; rc=$?
  if [[ "$esperado" == nonzero ]]; then
    [[ $rc -ne 0 ]] && return 0
  elif [[ $rc -eq $esperado ]]; then
    return 0
  fi
  echo "✖ esperava saída $esperado, veio $rc: $*" >&2
  return 1
}

# contem <arquivo> <regex> — falha com mensagem se o arquivo não casar com a regex.
contem() {
  grep -Eq -- "$2" "$1" && return 0
  echo "✖ não achei /$2/ em $1:" >&2; sed 's/^/    /' "$1" | head -40 >&2
  return 1
}

# nao_contem <arquivo> <regex>
nao_contem() {
  grep -Eq -- "$2" "$1" || return 0
  echo "✖ achei /$2/ em $1 (não deveria):" >&2; grep -En -- "$2" "$1" | head -10 >&2
  return 1
}

# ── Fumaça: todo *.sql roda limpo ──
# Falhas INTENCIONAIS conhecidas (dependem da config do cluster ou de parâmetro obrigatório):
# o arquivo pode sair != 0 desde que a única linha ERROR case com a regex abaixo.
declare -A _FUMACA_OK_SE=(
  [archive-command-health.sql]='FATAL: archive_mode='
  [checksum-failures-guard.sql]='FATAL: data_checksums='
  [ssl-enforcement-audit.sql]='FATAL: ssl='
  [wal-level-logical-guard.sql]='FATAL: wal_level='
  [logical-publication-guard.sql]='publicacao singu_cdc nao existe'
  [pg-stat-statements-config.sql]='pg_stat_statements (NAO instalado|instalado mas NAO carregado)'
  [schema-freeze-guard.sql]='Nenhum snapshot|permission denied for schema public'
  [pg-stat-statements-reset-guard.sql]='pg_stat_statements resetado ha'   # cluster recém-iniciado
)

# fumaca_sql [VAR=valor ...] — roda cada *.sql de verify/ com ON_ERROR_STOP=1. Devolve 1 se
# algum sair != 0 por erro cru (coluna/relação inexistente, sintaxe, privilégio...).
fumaca_sql() {
  local f base rc erros falhas=0 log
  for f in "$VERIFY_DIR"/*.sql; do
    base="$(basename "$f")"; log="$SCN_TMP/fumaca-$base.log"
    env "$@" psql -X -v ON_ERROR_STOP=1 -f "$f" >"$log" 2>&1; rc=$?
    if [[ $rc -eq 0 ]]; then
      echo "ok     $base"
      continue
    fi
    erros="$(grep -E 'ERROR:' "$log")"
    if [[ -n "${_FUMACA_OK_SE[$base]:-}" && "$(grep -c . <<<"$erros")" -eq 1 ]] \
       && grep -Eq -- "${_FUMACA_OK_SE[$base]}" <<<"$erros"; then
      echo "ok*    $base — falha intencional: ${erros#*ERROR:  }"
    else
      echo "FALHA  $base rc=$rc"; sed 's/^/         /' "$log" | tail -n 8
      falhas=$((falhas + 1))
    fi
  done
  echo "fumaça: $falhas arquivo(s) com erro cru"
  return $(( falhas > 0 ))
}

# valida_prom <arquivo> — formato de exposição do Prometheus (ver valida-prom.sh).
valida_prom() { bash "$SCRIPT_DIR/valida-prom.sh" "$1"; }
