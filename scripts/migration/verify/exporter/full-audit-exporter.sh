#!/usr/bin/env bash
# full-audit-exporter.sh — Rodada 26/10
# Executa full-audit.sh, parseia a saida e publica metricas no formato do Prometheus
# textfile collector (node_exporter). Deve rodar via cron a cada 5min.
#
# Metricas emitidas (auditoria valida):
#   guard_status{name="<guard>",severity="fatal|warn"} 0|1|2
#     0 = OK, 1 = WARN detectado, 2 = FATAL detectado
#   guard_last_run_timestamp_seconds  <unix epoch da ultima auditoria VALIDA>
#   guard_run_duration_seconds        <segundos>
#   guard_audit_exit_code             <codigo de saida do full-audit.sh>
#   guard_exporter_error              0
#   guard_exporter_up                 1
#
# Quando a auditoria NAO roda (sem conexao, config ausente, estouro de tempo, script
# ausente) o arquivo continua completo e valido, mas:
#   guard_exporter_error 1            e guard_exporter_up NAO e emitido (dispara o alerta
#                                     absent(guard_exporter_up) ja existente);
#   guard_status / guard_last_run_timestamp_seconds sao repetidos da ultima auditoria
#   valida (o dead-man continua contando; um FATAL ativo nao "some" por queda de rede).
#
# Variaveis de ambiente:
#   TEXTFILE_DIR           diretorio do textfile collector (default /var/lib/node_exporter/textfile_collector)
#   AUDIT_LOG_FILE         guarda o log do full-audit neste caminho (default: temporario, apagado)
#   AUDIT_TIMEOUT_SECONDS  limite de tempo da auditoria; 0 = sem limite (default 0)
#   AUDIT_SCRIPT           script de auditoria (default ../full-audit.sh; usado nos testes)
#
# Escrita atomica: grava em arquivo temporario no mesmo diretorio e faz rename.
# Execucoes sobrepostas: a segunda sai sem tocar no arquivo (flock).
# Codigos de saida: 0 = publicou auditoria valida (ou outra execucao em andamento);
#                   3 = publicou, mas a auditoria nao rodou; 1 = nao conseguiu publicar.
set -uo pipefail
export LC_ALL=C

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -uo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi

AUDIT_SCRIPT="${AUDIT_SCRIPT:-$SCRIPT_DIR/../full-audit.sh}"
OUT_DIR="${TEXTFILE_DIR:-/var/lib/node_exporter/textfile_collector}"
OUT_FILE="$OUT_DIR/db_guards.prom"
AUDIT_TIMEOUT="${AUDIT_TIMEOUT_SECONDS:-0}"
[[ "$AUDIT_TIMEOUT" =~ ^[0-9]+$ ]] || { echo "AUDIT_TIMEOUT_SECONDS invalido: $AUDIT_TIMEOUT" >&2; exit 1; }

mkdir -p "$OUT_DIR" 2>/dev/null
[[ -d "$OUT_DIR" && -w "$OUT_DIR" ]] || { echo "sem permissao de escrita em $OUT_DIR" >&2; exit 1; }

if command -v flock >/dev/null 2>&1; then
  exec 9>"$OUT_DIR/.db_guards.lock" || { echo "nao consegui criar o lock em $OUT_DIR" >&2; exit 1; }
  flock -n 9 || { echo "outra execucao do exporter em andamento; saindo sem alterar $OUT_FILE" >&2; exit 0; }
fi

TMP_FILE="$(mktemp "$OUT_DIR/.db_guards.XXXXXX")" || { echo "mktemp falhou em $OUT_DIR" >&2; exit 1; }
LOG_TEMP=""
if [[ -n "${AUDIT_LOG_FILE:-}" ]]; then
  LOG_FILE="$AUDIT_LOG_FILE"
else
  LOG_FILE="$(mktemp)" || { rm -f "$TMP_FILE"; exit 1; }
  LOG_TEMP=1
fi
trap 'rm -f "$TMP_FILE"; [[ -n "$LOG_TEMP" ]] && rm -f "$LOG_FILE"' EXIT
# O log pode conter trechos de queries de pg_stat_activity: so o dono le.
( umask 077; : >"$LOG_FILE" ) || { echo "nao consegui gravar o log em $LOG_FILE" >&2; exit 1; }

START_TS=$(date +%s)
if [[ ! -f "$AUDIT_SCRIPT" ]]; then
  echo "script de auditoria ausente: $AUDIT_SCRIPT" >"$LOG_FILE"
  AUDIT_EXIT=127
elif [[ "$AUDIT_TIMEOUT" -gt 0 ]] && command -v timeout >/dev/null 2>&1; then
  timeout "$AUDIT_TIMEOUT" bash "$AUDIT_SCRIPT" >"$LOG_FILE" 2>&1 9>&-
  AUDIT_EXIT=$?
else
  bash "$AUDIT_SCRIPT" >"$LOG_FILE" 2>&1 9>&-
  AUDIT_EXIT=$?
fi
END_TS=$(date +%s)
DURATION=$((END_TS - START_TS))

# Parse: "=== FATAL|WARN: <arquivo> ===" abre um guard; "=== FAIL: ===" marca fatal (2);
# "=== WARN-FAIL: ===" ou uma linha "WARNING:" dentro de um guard WARN marca warn (1).
declare -A STATUS=()
CURRENT_SEV=""
CURRENT_NAME=""
RE_INICIO='^\[full-audit [0-9:]+\] === (FATAL|WARN): (.+) ===$'
RE_FAIL='^\[full-audit [0-9:]+\] === FAIL: (.+) ===$'
RE_WARNFAIL='^\[full-audit [0-9:]+\] === WARN-FAIL: (.+) ===$'
while IFS= read -r line; do
  if [[ "$line" =~ $RE_INICIO ]]; then
    CURRENT_SEV="${BASH_REMATCH[1],,}"
    CURRENT_NAME="${BASH_REMATCH[2]%.sql}"
    STATUS["$CURRENT_NAME|$CURRENT_SEV"]=0
  elif [[ "$line" =~ $RE_FAIL ]]; then
    STATUS["${BASH_REMATCH[1]%.sql}|fatal"]=2
  elif [[ "$line" =~ $RE_WARNFAIL ]]; then
    STATUS["${BASH_REMATCH[1]%.sql}|warn"]=1
  elif [[ "$line" == *"WARNING:"* && -n "$CURRENT_NAME" && "$CURRENT_SEV" == "warn" ]]; then
    STATUS["$CURRENT_NAME|warn"]=1
  fi
done <"$LOG_FILE"

# Auditoria valida = terminou com 0 (sem fatal) ou 1 (com fatal) E rodou ao menos um guard.
VALIDA=0
if [[ ( "$AUDIT_EXIT" -eq 0 || "$AUDIT_EXIT" -eq 1 ) && ${#STATUS[@]} -gt 0 ]]; then VALIDA=1; fi

escapa() { local v="${1//\\/\\\\}"; v="${v//\"/\\\"}"; printf '%s' "${v//$'\n'/\\n}"; }

{
  echo "# HELP guard_status Status do guard (0=ok,1=warn,2=fatal)"
  echo "# TYPE guard_status gauge"
  if [[ $VALIDA -eq 1 ]]; then
    for key in "${!STATUS[@]}"; do
      printf 'guard_status{name="%s",severity="%s"} %d\n' "$(escapa "${key%|*}")" "${key##*|}" "${STATUS[$key]}"
    done | sort
  elif [[ -f "$OUT_FILE" ]]; then
    grep -E '^guard_status\{' "$OUT_FILE" | sort
  fi
  echo "# HELP guard_last_run_timestamp_seconds Unix ts da ultima auditoria valida"
  echo "# TYPE guard_last_run_timestamp_seconds gauge"
  if [[ $VALIDA -eq 1 ]]; then
    echo "guard_last_run_timestamp_seconds $END_TS"
  elif [[ -f "$OUT_FILE" ]]; then
    grep -E '^guard_last_run_timestamp_seconds [0-9]+$' "$OUT_FILE" | head -n 1
  fi
  echo "# HELP guard_run_duration_seconds Duracao do full-audit"
  echo "# TYPE guard_run_duration_seconds gauge"
  echo "guard_run_duration_seconds $DURATION"
  echo "# HELP guard_audit_exit_code Exit code do full-audit (0=ok, 1=fatais, 2=config, 3=sem conexao, 124=tempo esgotado, 127=script ausente)"
  echo "# TYPE guard_audit_exit_code gauge"
  echo "guard_audit_exit_code $AUDIT_EXIT"
  echo "# HELP guard_exporter_error 1 se a auditoria nao rodou (metricas de status repetidas da ultima valida)"
  echo "# TYPE guard_exporter_error gauge"
  echo "guard_exporter_error $((1 - VALIDA))"
  if [[ $VALIDA -eq 1 ]]; then
    echo "# HELP guard_exporter_up 1 se exporter rodou ate o fim com auditoria valida (ausente em caso de erro)"
    echo "# TYPE guard_exporter_up gauge"
    echo "guard_exporter_up 1"
  fi
} >"$TMP_FILE" || { echo "falha ao gravar $TMP_FILE" >&2; exit 1; }

# mktemp cria 0600; o node_exporter roda com outro usuario e precisa ler.
chmod 0644 "$TMP_FILE"
mv -f "$TMP_FILE" "$OUT_FILE" || { echo "falha ao publicar $OUT_FILE" >&2; exit 1; }
if [[ $VALIDA -eq 0 ]]; then
  echo "auditoria nao rodou (exit=$AUDIT_EXIT); $OUT_FILE publicado com guard_exporter_error 1" >&2
  exit 3
fi
exit 0
