#!/usr/bin/env bash
# rpc-perf-exporter.sh — Prometheus textfile collector for RPC performance samples.
#
# Emits per-RPC latency percentiles (p50/p95/p99/max, as gauges with a `quantile` label)
# and sample counts over a rolling window, sourced from public.rpc_perf_samples.
#
# Uso (escolha um):
#   a) stdout (compatível com o cron antigo): rode a cada 60s redirecionando para
#      <textfile_dir>/rpc_perf.prom.tmp e renomeie para rpc_perf.prom;
#   b) TEXTFILE_DIR=<dir> (ou RPC_PERF_OUT_FILE=<arquivo.prom>): o próprio script grava em
#      temporário no mesmo diretório e renomeia (escrita atômica).
#
# Env vars: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (standard libpq).
#   RPC_PERF_WINDOW_MINUTES  janela em minutos (default 10; inteiro 1..1440)
#   RPC_PERF_SLOW_P95_MS     limiar informativo de p95 (default 800)
#
# Se a consulta falha (banco fora, tabela ausente, permissão) a saída continua sendo um
# documento COMPLETO e válido, com rpc_perf_exporter_up 0 e sem amostras — nunca um
# arquivo vazio ou cortado no meio.
# Códigos de saída: 0 = ok; 2 = consulta falhou (publicou up=0); 1 = erro de uso/escrita.
# Somente leitura no banco.
set -euo pipefail
export LC_ALL=C

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi

WINDOW_MINUTES="${RPC_PERF_WINDOW_MINUTES:-10}"
SLOW_P95_MS="${RPC_PERF_SLOW_P95_MS:-800}"
if [[ ! "$WINDOW_MINUTES" =~ ^[0-9]+$ ]] || (( WINDOW_MINUTES < 1 || WINDOW_MINUTES > 1440 )); then
  echo "RPC_PERF_WINDOW_MINUTES invalido: $WINDOW_MINUTES (inteiro 1..1440)" >&2; exit 1
fi
[[ "$SLOW_P95_MS" =~ ^[0-9]+([.][0-9]+)?$ ]] || { echo "RPC_PERF_SLOW_P95_MS invalido: $SLOW_P95_MS" >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "psql nao encontrado no PATH" >&2; exit 1; }

OUT_FILE="${RPC_PERF_OUT_FILE:-}"
[[ -z "$OUT_FILE" && -n "${TEXTFILE_DIR:-}" ]] && OUT_FILE="$TEXTFILE_DIR/rpc_perf.prom"

SQL=$(cat <<SQL
SELECT
  rpc_name,
  COUNT(*)::int AS samples,
  ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p50_ms,
  ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p95_ms,
  ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p99_ms,
  ROUND(MAX(duration_ms)::numeric, 2) AS max_ms
FROM public.rpc_perf_samples
WHERE created_at >= now() - make_interval(mins => ${WINDOW_MINUTES})
GROUP BY rpc_name
ORDER BY rpc_name;
SQL
)

UP=1
ROWS=""
if ! ROWS=$(PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}" psql -X -A -F $'\t' -t -v ON_ERROR_STOP=1 -c "$SQL" 2>/dev/null); then
  UP=0; ROWS=""
  echo "rpc-perf-exporter: consulta falhou; publicando rpc_perf_exporter_up 0" >&2
fi

NUM='^-?[0-9]+([.][0-9]+)?$'
# As amostras de cada métrica saem agrupadas (HELP, TYPE, amostras), como pede o formato.
gera() {
  local rpc samples p50 p95 p99 max rpc_label b_samples="" b_lat=""
  local -A visto=()
  while IFS=$'\t' read -r rpc samples p50 p95 p99 max; do
    [[ -n "${rpc:-}" ]] || continue
    # linha incompleta ou não numérica invalidaria o arquivo inteiro no node_exporter
    [[ "$samples" =~ ^[0-9]+$ && "$p50" =~ $NUM && "$p95" =~ $NUM && "$p99" =~ $NUM && "$max" =~ $NUM ]] || continue
    # Prometheus label-safe RPC name; nomes que colidem depois da limpeza: fica o primeiro
    rpc_label="${rpc//[^a-zA-Z0-9_]/_}"
    [[ -z "${visto[$rpc_label]:-}" ]] || continue
    visto[$rpc_label]=1
    b_samples+="rpc_perf_samples_total{rpc=\"$rpc_label\"} $samples"$'\n'
    b_lat+="rpc_perf_latency_ms{rpc=\"$rpc_label\",quantile=\"0.5\"} $p50"$'\n'
    b_lat+="rpc_perf_latency_ms{rpc=\"$rpc_label\",quantile=\"0.95\"} $p95"$'\n'
    b_lat+="rpc_perf_latency_ms{rpc=\"$rpc_label\",quantile=\"0.99\"} $p99"$'\n'
    b_lat+="rpc_perf_latency_ms{rpc=\"$rpc_label\",quantile=\"max\"} $max"$'\n'
  done <<<"$ROWS"
  echo "# HELP rpc_perf_samples_total Number of RPC samples in the rolling window."
  echo "# TYPE rpc_perf_samples_total gauge"
  printf '%s' "$b_samples"
  echo "# HELP rpc_perf_latency_ms Latency percentiles for RPC calls in the rolling window."
  echo "# TYPE rpc_perf_latency_ms gauge"
  printf '%s' "$b_lat"
  echo "# HELP rpc_perf_slow_p95_threshold_ms Threshold at which a RPC is considered slow."
  echo "# TYPE rpc_perf_slow_p95_threshold_ms gauge"
  echo "rpc_perf_slow_p95_threshold_ms ${SLOW_P95_MS}"
  echo "# HELP rpc_perf_exporter_up 1 if the last collection query succeeded, 0 otherwise."
  echo "# TYPE rpc_perf_exporter_up gauge"
  echo "rpc_perf_exporter_up ${UP}"
  echo "# HELP rpc_perf_exporter_last_run_timestamp_seconds Unix time of the last exporter run."
  echo "# TYPE rpc_perf_exporter_last_run_timestamp_seconds gauge"
  echo "rpc_perf_exporter_last_run_timestamp_seconds $(date +%s)"
}

DOC="$(gera)"
if [[ -n "$OUT_FILE" ]]; then
  OUT_DIR="$(dirname "$OUT_FILE")"
  mkdir -p "$OUT_DIR" 2>/dev/null || true
  TMP_FILE="$(mktemp "$OUT_DIR/.rpc_perf.XXXXXX")" || { echo "sem permissao de escrita em $OUT_DIR" >&2; exit 1; }
  trap 'rm -f "$TMP_FILE"' EXIT
  printf '%s\n' "$DOC" >"$TMP_FILE"
  chmod 0644 "$TMP_FILE"
  mv -f "$TMP_FILE" "$OUT_FILE"
else
  printf '%s\n' "$DOC"
fi
[[ "$UP" -eq 1 ]] || exit 2
