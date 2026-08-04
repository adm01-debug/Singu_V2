#!/usr/bin/env bash
# rpc-plan-exporter.sh — Prometheus textfile collector para regressões de plano.
#
# Rodada 65/10. Exporta, por RPC monitorada, quantas mudanças estruturais de
# plano de execução ocorreram na janela recente (coluna materializada
# rpc_plan_snapshots.plan_changed) e há quantos segundos foi a última.
#
# Uso: cron a cada 60s, gravando em *.prom.tmp no textfile dir do node_exporter
# e renomeando atomicamente para *.prom.
#
# Env vars: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (libpq padrão).
#           RPC_PLAN_WINDOW_HOURS (default 6, máx 168).

set -euo pipefail

WINDOW_HOURS="${RPC_PLAN_WINDOW_HOURS:-6}"

SQL=$(cat <<SQL
SELECT
  s.rpc_name,
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
WHERE s.captured_at >= now() - make_interval(hours => LEAST(GREATEST(${WINDOW_HOURS}, 1), 168))
GROUP BY s.rpc_name, p.p95_ms;
SQL
)

echo "# HELP rpc_plan_changed Numero de snapshots com mudanca estrutural de plano na janela."
echo "# TYPE rpc_plan_changed gauge"
echo "# HELP rpc_plan_change_age_seconds Segundos desde a ultima mudanca de plano (-1 = nenhuma)."
echo "# TYPE rpc_plan_change_age_seconds gauge"
echo "# HELP rpc_plan_snapshots_total Snapshots capturados na janela."
echo "# TYPE rpc_plan_snapshots_total gauge"
echo "# HELP rpc_plan_window_hours Janela de observacao usada pelo exporter."
echo "# TYPE rpc_plan_window_hours gauge"
echo "# HELP rpc_plan_p95_ms p95 (24h) de duracao da RPC, para correlacionar churn com degradacao (-1 = sem amostras)."
echo "# TYPE rpc_plan_p95_ms gauge"
echo "rpc_plan_window_hours ${WINDOW_HOURS}"

psql -X -A -F $'\t' -t -c "$SQL" | while IFS=$'\t' read -r rpc changes age snapshots p95; do
  [ -z "${rpc:-}" ] && continue
  echo "rpc_plan_changed{rpc=\"${rpc}\"} ${changes}"
  echo "rpc_plan_change_age_seconds{rpc=\"${rpc}\"} ${age}"
  echo "rpc_plan_snapshots_total{rpc=\"${rpc}\"} ${snapshots}"
  echo "rpc_plan_p95_ms{rpc=\"${rpc}\"} ${p95:--1}"
done
