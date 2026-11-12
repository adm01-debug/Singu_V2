#!/usr/bin/env bash
# rpc-plan-exporter.sh — Prometheus textfile collector para regressões de plano.
#
# Rodada 65/10. Exporta, por RPC monitorada, quantas mudanças estruturais de
# plano de execução ocorreram na janela recente (coluna materializada
# rpc_plan_snapshots.plan_changed) e há quantos segundos foi a última.
#
# Uso (escolha um):
#   a) stdout (compatível com o cron antigo): cron a cada 60s, gravando em *.prom.tmp no
#      textfile dir do node_exporter e renomeando atomicamente para *.prom;
#   b) TEXTFILE_DIR=<dir> (ou RPC_PLAN_OUT_FILE=<arquivo.prom>): o próprio script grava em
#      temporário no mesmo diretório e renomeia (escrita atômica).
#
# Env vars: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (libpq padrão).
#           RPC_PLAN_WINDOW_HOURS (default 6; inteiro, limitado a 1..168 — a métrica
#           rpc_plan_window_hours publica o valor efetivamente usado).
#
# Se a consulta falha, a saída continua sendo um documento COMPLETO e válido, com
# rpc_plan_exporter_up 0, sem amostras por RPC e SEM rpc_plan_window_hours (o alerta
# RpcPlanExporterMissing usa absent(rpc_plan_window_hours)).
# Códigos de saída: 0 = ok; 2 = consulta falhou (publicou up=0); 1 = erro de uso/escrita.
# Somente leitura no banco.
set -euo pipefail
export LC_ALL=C

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi

WINDOW_HOURS="${RPC_PLAN_WINDOW_HOURS:-6}"
[[ "$WINDOW_HOURS" =~ ^[0-9]+$ ]] || { echo "RPC_PLAN_WINDOW_HOURS invalido: $WINDOW_HOURS (inteiro)" >&2; exit 1; }
WINDOW_HOURS=$(( 10#$WINDOW_HOURS ))
(( WINDOW_HOURS < 1 )) && WINDOW_HOURS=1
(( WINDOW_HOURS > 168 )) && WINDOW_HOURS=168
command -v psql >/dev/null 2>&1 || { echo "psql nao encontrado no PATH" >&2; exit 1; }

OUT_FILE="${RPC_PLAN_OUT_FILE:-}"
[[ -z "$OUT_FILE" && -n "${TEXTFILE_DIR:-}" ]] && OUT_FILE="$TEXTFILE_DIR/rpc_plan.prom"

SQL=$(cat <<SQL
SELECT
  translate(s.rpc_name, E'\t\n\r', '   ') AS rpc_name,
  COUNT(*) FILTER (WHERE s.plan_changed)::int AS changes,
  COALESCE(
    ROUND(EXTRACT(EPOCH FROM (now() - MAX(s.captured_at) FILTER (WHERE s.plan_changed)))::numeric, 0),
    -1
  ) AS age_seconds,
  COUNT(*)::int AS snapshots,
  COALESCE(ROUND(p.p95_ms, 0), -1) AS p95_ms
FROM public.rpc_plan_snapshots s
LEFT JOIN LATERAL (
  SELECT percentile_disc(0.95) WITHIN GROUP (ORDER BY r.duration_ms) AS p95_ms
  FROM public.rpc_perf_samples r
  WHERE r.rpc_name = s.rpc_name
    AND r.created_at >= now() - interval '24 hours'
) p ON TRUE
WHERE s.captured_at >= now() - make_interval(hours => ${WINDOW_HOURS})
GROUP BY s.rpc_name, p.p95_ms
ORDER BY 1;
SQL
)

UP=1
ROWS=""
if ! ROWS=$(PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}" psql -X -A -F $'\t' -t -v ON_ERROR_STOP=1 -c "$SQL" 2>/dev/null); then
  UP=0; ROWS=""
  echo "rpc-plan-exporter: consulta falhou; publicando rpc_plan_exporter_up 0" >&2
fi

NUM='^-?[0-9]+([.][0-9]+)?$'
# valor de label: escapa barra invertida, aspas e quebra de linha (formato de exposição)
escapa() { local v="${1//\\/\\\\}"; v="${v//\"/\\\"}"; printf '%s' "${v//$'\n'/\\n}"; }

# As amostras de cada métrica saem agrupadas (HELP, TYPE, amostras), como pede o formato.
gera() {
  local rpc changes age snapshots p95 l b_chg="" b_age="" b_snap="" b_p95=""
  local -A visto=()
  while IFS=$'\t' read -r rpc changes age snapshots p95; do
    [[ -n "${rpc:-}" ]] || continue
    p95="${p95:--1}"
    [[ "$changes" =~ ^[0-9]+$ && "$age" =~ $NUM && "$snapshots" =~ ^[0-9]+$ && "$p95" =~ $NUM ]] || continue
    l="$(escapa "$rpc")"
    [[ -z "${visto[$l]:-}" ]] || continue
    visto[$l]=1
    b_chg+="rpc_plan_changed{rpc=\"${l}\"} ${changes}"$'\n'
    b_age+="rpc_plan_change_age_seconds{rpc=\"${l}\"} ${age}"$'\n'
    b_snap+="rpc_plan_snapshots_total{rpc=\"${l}\"} ${snapshots}"$'\n'
    b_p95+="rpc_plan_p95_ms{rpc=\"${l}\"} ${p95}"$'\n'
  done <<<"$ROWS"
  echo "# HELP rpc_plan_changed Numero de snapshots com mudanca estrutural de plano na janela."
  echo "# TYPE rpc_plan_changed gauge"
  printf '%s' "$b_chg"
  echo "# HELP rpc_plan_change_age_seconds Segundos desde a ultima mudanca de plano (-1 = nenhuma)."
  echo "# TYPE rpc_plan_change_age_seconds gauge"
  printf '%s' "$b_age"
  echo "# HELP rpc_plan_snapshots_total Snapshots capturados na janela."
  echo "# TYPE rpc_plan_snapshots_total gauge"
  printf '%s' "$b_snap"
  echo "# HELP rpc_plan_p95_ms p95 (24h) de duracao da RPC, para correlacionar churn com degradacao (-1 = sem amostras)."
  echo "# TYPE rpc_plan_p95_ms gauge"
  printf '%s' "$b_p95"
  echo "# HELP rpc_plan_window_hours Janela de observacao usada pelo exporter."
  echo "# TYPE rpc_plan_window_hours gauge"
  [[ "$UP" -eq 1 ]] && echo "rpc_plan_window_hours ${WINDOW_HOURS}"
  echo "# HELP rpc_plan_exporter_up 1 se a ultima consulta do exporter funcionou, 0 caso contrario."
  echo "# TYPE rpc_plan_exporter_up gauge"
  echo "rpc_plan_exporter_up ${UP}"
  echo "# HELP rpc_plan_exporter_last_run_timestamp_seconds Unix time da ultima execucao do exporter."
  echo "# TYPE rpc_plan_exporter_last_run_timestamp_seconds gauge"
  echo "rpc_plan_exporter_last_run_timestamp_seconds $(date +%s)"
}

DOC="$(gera)"
if [[ -n "$OUT_FILE" ]]; then
  OUT_DIR="$(dirname "$OUT_FILE")"
  mkdir -p "$OUT_DIR" 2>/dev/null || true
  TMP_FILE="$(mktemp "$OUT_DIR/.rpc_plan.XXXXXX")" || { echo "sem permissao de escrita em $OUT_DIR" >&2; exit 1; }
  trap 'rm -f "$TMP_FILE"' EXIT
  printf '%s\n' "$DOC" >"$TMP_FILE"
  chmod 0644 "$TMP_FILE"
  mv -f "$TMP_FILE" "$OUT_FILE"
else
  printf '%s\n' "$DOC"
fi
[[ "$UP" -eq 1 ]] || exit 2
