#!/usr/bin/env bash
# rpc-perf-exporter.sh — Prometheus textfile collector for RPC performance samples.
#
# Emits per-RPC latency histograms (p50/p95/p99) and sample counts over a
# rolling 10-minute window, sourced from public.rpc_perf_samples.
#
# Usage: run every 60s from cron and redirect to a *.prom.tmp file under the
# node_exporter textfile directory, then atomically rename to *.prom.
#
# Env vars: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (standard libpq).

set -euo pipefail

WINDOW_MINUTES="${RPC_PERF_WINDOW_MINUTES:-10}"
SLOW_P95_MS="${RPC_PERF_SLOW_P95_MS:-800}"

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
GROUP BY rpc_name;
SQL
)

echo "# HELP rpc_perf_samples_total Number of RPC samples in the rolling window."
echo "# TYPE rpc_perf_samples_total gauge"
echo "# HELP rpc_perf_latency_ms Latency percentiles for RPC calls in the rolling window."
echo "# TYPE rpc_perf_latency_ms gauge"
echo "# HELP rpc_perf_slow_p95_threshold_ms Threshold at which a RPC is considered slow."
echo "# TYPE rpc_perf_slow_p95_threshold_ms gauge"
echo "rpc_perf_slow_p95_threshold_ms ${SLOW_P95_MS}"

psql -X -A -F $'\t' -t -c "$SQL" | while IFS=$'\t' read -r rpc samples p50 p95 p99 max; do
  [ -z "${rpc:-}" ] && continue
  # Prometheus label-safe RPC name
  rpc_label=$(printf '%s' "$rpc" | sed 's/[^a-zA-Z0-9_]/_/g')
  printf 'rpc_perf_samples_total{rpc="%s"} %s\n' "$rpc_label" "$samples"
  printf 'rpc_perf_latency_ms{rpc="%s",quantile="0.5"} %s\n' "$rpc_label" "$p50"
  printf 'rpc_perf_latency_ms{rpc="%s",quantile="0.95"} %s\n' "$rpc_label" "$p95"
  printf 'rpc_perf_latency_ms{rpc="%s",quantile="0.99"} %s\n' "$rpc_label" "$p99"
  printf 'rpc_perf_latency_ms{rpc="%s",quantile="max"} %s\n' "$rpc_label" "$max"
done