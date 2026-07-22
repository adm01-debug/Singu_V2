#!/usr/bin/env bash
# full-audit-exporter.sh — Rodada 26/10
# Executa full-audit.sh, parseia saida e emite metricas no formato Prometheus
# textfile collector. Deve rodar via cron a cada 5min.
#
# Metricas emitidas:
#   guard_status{name="<guard>",severity="fatal|warn"} 0|1|2
#     0 = OK, 1 = WARN detectado, 2 = FATAL detectado
#   guard_last_run_timestamp_seconds  <unix epoch>
#   guard_run_duration_seconds        <segundos>
#   guard_exporter_up                 1
#
# Escrita atomica: escreve em .tmp e faz rename (node_exporter exige).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUDIT_SCRIPT="$SCRIPT_DIR/../full-audit.sh"
OUT_DIR="${TEXTFILE_DIR:-/var/lib/node_exporter/textfile_collector}"
OUT_FILE="$OUT_DIR/db_guards.prom"
TMP_FILE="$OUT_FILE.$$.tmp"
LOG_FILE="${AUDIT_LOG_FILE:-/tmp/full-audit-$(date -u +%Y%m%dT%H%M%SZ).log}"

mkdir -p "$OUT_DIR"

START_TS=$(date +%s)
bash "$AUDIT_SCRIPT" >"$LOG_FILE" 2>&1
AUDIT_EXIT=$?
END_TS=$(date +%s)
DURATION=$((END_TS - START_TS))

# Parse: linhas "FATAL: <file>" ou "WARN: <file>" seguidas de "FAIL: <file>"
declare -A STATUS
CURRENT_SEV=""
CURRENT_NAME=""
while IFS= read -r line; do
  if [[ "$line" =~ ^\[full-audit[[:space:]][0-9:]+\][[:space:]]===[[:space:]](FATAL|WARN):[[:space:]](.+)[[:space:]]===$ ]]; then
    CURRENT_SEV="${BASH_REMATCH[1],,}"
    CURRENT_NAME="${BASH_REMATCH[2]%.sql}"
    # default OK ate provar contrario
    STATUS["$CURRENT_NAME|$CURRENT_SEV"]=0
  elif [[ "$line" =~ ^\[full-audit[[:space:]][0-9:]+\][[:space:]]===[[:space:]]FAIL:[[:space:]](.+)[[:space:]]===$ ]]; then
    name="${BASH_REMATCH[1]%.sql}"
    STATUS["$name|fatal"]=2
  elif [[ "$line" == *"WARNING:"* && -n "$CURRENT_NAME" && "$CURRENT_SEV" == "warn" ]]; then
    STATUS["$CURRENT_NAME|warn"]=1
  fi
done <"$LOG_FILE"

{
  echo "# HELP guard_status Status do guard (0=ok,1=warn,2=fatal)"
  echo "# TYPE guard_status gauge"
  for key in "${!STATUS[@]}"; do
    name="${key%|*}"
    sev="${key##*|}"
    printf 'guard_status{name="%s",severity="%s"} %d\n' "$name" "$sev" "${STATUS[$key]}"
  done
  echo "# HELP guard_last_run_timestamp_seconds Unix ts do ultimo full-audit"
  echo "# TYPE guard_last_run_timestamp_seconds gauge"
  echo "guard_last_run_timestamp_seconds $END_TS"
  echo "# HELP guard_run_duration_seconds Duracao do full-audit"
  echo "# TYPE guard_run_duration_seconds gauge"
  echo "guard_run_duration_seconds $DURATION"
  echo "# HELP guard_audit_exit_code Exit code agregado (0=ok, >0=fatais)"
  echo "# TYPE guard_audit_exit_code gauge"
  echo "guard_audit_exit_code $AUDIT_EXIT"
  echo "# HELP guard_exporter_up 1 se exporter rodou ate o fim"
  echo "# TYPE guard_exporter_up gauge"
  echo "guard_exporter_up 1"
} >"$TMP_FILE"

mv -f "$TMP_FILE" "$OUT_FILE"
exit 0