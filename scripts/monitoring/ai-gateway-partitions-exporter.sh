#!/usr/bin/env bash
# ai-gateway-partitions-exporter.sh — Rodada 59/10
# Emite metricas Prometheus (textfile collector) sobre as particoes de
# public.ai_gateway_metrics para alertar bloat e falhas de retencao.
#
# Metricas emitidas:
#   aigw_partition_bytes{partition="<name>"}          <bytes>
#   aigw_partition_rows{partition="<name>"}           <estimated rows>
#   aigw_partition_is_current{partition="<name>"}     0|1
#   aigw_partition_is_future{partition="<name>"}      0|1
#   aigw_partition_is_expiring{partition="<name>"}    0|1
#   aigw_partitions_total                             <count>
#   aigw_partitions_over_bytes_limit                  <count>  (>500MB)
#   aigw_partitions_over_rows_limit                   <count>  (>5M linhas)
#   aigw_partitions_expiring_not_dropped              <count>
#   aigw_partitions_exporter_up                       1
#   aigw_partitions_last_run_timestamp_seconds        <unix epoch>
#
# Requer: psql com PG* env vars configuradas e usuario com permissao para
# ler pg_class/pg_inherits (superuser ou role dedicada de monitoramento).
#
# Thresholds (override via env):
#   AIGW_BYTES_LIMIT   default 524288000  (500 MB)
#   AIGW_ROWS_LIMIT    default 5000000    (5M linhas)
set -uo pipefail

OUT_DIR="${TEXTFILE_DIR:-/var/lib/node_exporter/textfile_collector}"
OUT_FILE="$OUT_DIR/aigw_partitions.prom"
TMP_FILE="$OUT_FILE.$$.tmp"
BYTES_LIMIT="${AIGW_BYTES_LIMIT:-524288000}"
ROWS_LIMIT="${AIGW_ROWS_LIMIT:-5000000}"
RETENTION_DAYS="${AIGW_RETENTION_DAYS:-90}"

mkdir -p "$OUT_DIR"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql nao encontrado no PATH" >&2
  exit 1
fi

# Query direta em catalogos: nao depende da RPC (evita RLS/admin scope).
read -r -d '' QUERY <<SQL || true
WITH parts AS (
  SELECT
    c.oid,
    c.relname,
    pg_get_expr(c.relpartbound, c.oid) AS bounds,
    c.reltuples::bigint                 AS est_rows,
    pg_total_relation_size(c.oid)       AS total_bytes
  FROM pg_inherits i
  JOIN pg_class c  ON c.oid = i.inhrelid
  JOIN pg_class p  ON p.oid = i.inhparent
  JOIN pg_namespace np ON np.oid = p.relnamespace
  WHERE np.nspname = 'public' AND p.relname = 'ai_gateway_metrics'
)
SELECT
  relname,
  est_rows,
  total_bytes,
  (regexp_match(bounds, 'FROM \(''([^'']+)''\)'))[1] AS range_start,
  (regexp_match(bounds, 'TO \(''([^'']+)''\)'))[1]   AS range_end
FROM parts
ORDER BY relname;
SQL

ROWS=$(psql -X -A -t -F '|' -c "$QUERY" 2>/dev/null) || {
  echo "aigw_partitions_exporter_up 0" >"$TMP_FILE"
  mv "$TMP_FILE" "$OUT_FILE"
  exit 2
}

NOW_TS=$(date +%s)
CUTOFF_TS=$(( NOW_TS - RETENTION_DAYS * 86400 ))

TOTAL=0
OVER_BYTES=0
OVER_ROWS=0
EXPIRING_NOT_DROPPED=0

{
  echo "# HELP aigw_partition_bytes Tamanho fisico da particao em bytes"
  echo "# TYPE aigw_partition_bytes gauge"
  echo "# HELP aigw_partition_rows Estimativa de linhas (reltuples)"
  echo "# TYPE aigw_partition_rows gauge"
  echo "# HELP aigw_partition_is_current 1 se a particao cobre o instante atual"
  echo "# TYPE aigw_partition_is_current gauge"
  echo "# HELP aigw_partition_is_future 1 se a particao esta no futuro"
  echo "# TYPE aigw_partition_is_future gauge"
  echo "# HELP aigw_partition_is_expiring 1 se a particao ja passou da janela de retencao"
  echo "# TYPE aigw_partition_is_expiring gauge"

  while IFS='|' read -r name est_rows total_bytes range_start range_end; do
    [[ -z "$name" ]] && continue
    TOTAL=$((TOTAL + 1))
    est_rows="${est_rows:-0}"
    total_bytes="${total_bytes:-0}"

    start_ts=$(date -u -d "$range_start" +%s 2>/dev/null || echo 0)
    end_ts=$(date -u -d "$range_end" +%s 2>/dev/null || echo 0)
    is_current=0; is_future=0; is_expiring=0
    (( NOW_TS >= start_ts && NOW_TS < end_ts )) && is_current=1
    (( start_ts > NOW_TS )) && is_future=1
    (( end_ts > 0 && end_ts <= CUTOFF_TS )) && is_expiring=1

    (( total_bytes > BYTES_LIMIT )) && OVER_BYTES=$((OVER_BYTES + 1))
    (( est_rows > ROWS_LIMIT ))     && OVER_ROWS=$((OVER_ROWS + 1))
    (( is_expiring == 1 ))          && EXPIRING_NOT_DROPPED=$((EXPIRING_NOT_DROPPED + 1))

    echo "aigw_partition_bytes{partition=\"$name\"} $total_bytes"
    echo "aigw_partition_rows{partition=\"$name\"} $est_rows"
    echo "aigw_partition_is_current{partition=\"$name\"} $is_current"
    echo "aigw_partition_is_future{partition=\"$name\"} $is_future"
    echo "aigw_partition_is_expiring{partition=\"$name\"} $is_expiring"
  done <<<"$ROWS"

  echo "# HELP aigw_partitions_total Numero total de particoes"
  echo "# TYPE aigw_partitions_total gauge"
  echo "aigw_partitions_total $TOTAL"

  echo "# HELP aigw_partitions_over_bytes_limit Particoes acima do limite de bytes"
  echo "# TYPE aigw_partitions_over_bytes_limit gauge"
  echo "aigw_partitions_over_bytes_limit $OVER_BYTES"

  echo "# HELP aigw_partitions_over_rows_limit Particoes acima do limite de linhas"
  echo "# TYPE aigw_partitions_over_rows_limit gauge"
  echo "aigw_partitions_over_rows_limit $OVER_ROWS"

  echo "# HELP aigw_partitions_expiring_not_dropped Particoes fora da janela mas ainda nao removidas"
  echo "# TYPE aigw_partitions_expiring_not_dropped gauge"
  echo "aigw_partitions_expiring_not_dropped $EXPIRING_NOT_DROPPED"

  echo "# HELP aigw_partitions_exporter_up 1 se o exporter rodou com sucesso"
  echo "# TYPE aigw_partitions_exporter_up gauge"
  echo "aigw_partitions_exporter_up 1"

  echo "# HELP aigw_partitions_last_run_timestamp_seconds Ultimo run em unix epoch"
  echo "# TYPE aigw_partitions_last_run_timestamp_seconds gauge"
  echo "aigw_partitions_last_run_timestamp_seconds $NOW_TS"
} >"$TMP_FILE"

mv "$TMP_FILE" "$OUT_FILE"
exit 0