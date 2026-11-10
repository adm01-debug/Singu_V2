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
#   aigw_partitions_exporter_up                       1 (0 se a consulta falhou)
#   aigw_partitions_last_run_timestamp_seconds        <unix epoch da ultima execucao>
#
# Requer: psql com PG* env vars configuradas e usuario com permissao para
# ler pg_class/pg_inherits (superuser ou role dedicada de monitoramento).
#
# Variaveis de ambiente:
#   TEXTFILE_DIR         diretorio do textfile collector (default /var/lib/node_exporter/textfile_collector)
#   AIGW_BYTES_LIMIT     default 524288000  (500 MB)
#   AIGW_ROWS_LIMIT      default 5000000    (5M linhas)
#   AIGW_RETENTION_DAYS  default 90
#
# Escrita atomica: temporario no mesmo diretorio + rename. Se a consulta falha, publica um
# arquivo completo e valido com aigw_partitions_exporter_up 0 (sem metricas por particao).
# Codigos de saida: 0 = ok; 2 = consulta falhou (publicou up=0); 1 = erro de uso/escrita.
# Somente leitura no banco.
set -uo pipefail
export LC_ALL=C

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -uo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi

OUT_DIR="${TEXTFILE_DIR:-/var/lib/node_exporter/textfile_collector}"
OUT_FILE="$OUT_DIR/aigw_partitions.prom"
BYTES_LIMIT="${AIGW_BYTES_LIMIT:-524288000}"
ROWS_LIMIT="${AIGW_ROWS_LIMIT:-5000000}"
RETENTION_DAYS="${AIGW_RETENTION_DAYS:-90}"
for par in "AIGW_BYTES_LIMIT=$BYTES_LIMIT" "AIGW_ROWS_LIMIT=$ROWS_LIMIT" "AIGW_RETENTION_DAYS=$RETENTION_DAYS"; do
  [[ "${par#*=}" =~ ^[0-9]+$ ]] || { echo "${par%%=*} invalido: ${par#*=} (inteiro >= 0)" >&2; exit 1; }
done

if ! command -v psql >/dev/null 2>&1; then
  echo "psql nao encontrado no PATH" >&2
  exit 1
fi

mkdir -p "$OUT_DIR" 2>/dev/null
[[ -d "$OUT_DIR" && -w "$OUT_DIR" ]] || { echo "sem permissao de escrita em $OUT_DIR" >&2; exit 1; }
TMP_FILE="$(mktemp "$OUT_DIR/.aigw_partitions.XXXXXX")" || { echo "mktemp falhou em $OUT_DIR" >&2; exit 1; }
trap 'rm -f "$TMP_FILE"' EXIT

# Query direta em catalogos: nao depende da RPC (evita RLS/admin scope).
# reltuples = -1 em particao nunca analisada (PG14+): vira 0.
read -r -d '' QUERY <<SQL || true
WITH parts AS (
  SELECT
    c.oid,
    c.relname,
    pg_get_expr(c.relpartbound, c.oid) AS bounds,
    GREATEST(c.reltuples, 0)::bigint    AS est_rows,
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

NOW_TS=$(date +%s)
UP=1
ERRO_PSQL=""
if ! ROWS=$(PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}" psql -X -A -t -F '|' -v ON_ERROR_STOP=1 -c "$QUERY" 2>"$TMP_FILE"); then
  UP=0; ROWS=""
  ERRO_PSQL="$(head -n 1 "$TMP_FILE")"
  echo "aigw-partitions-exporter: consulta falhou (${ERRO_PSQL:-sem mensagem}); publicando aigw_partitions_exporter_up 0" >&2
fi

CUTOFF_TS=$(( NOW_TS - RETENTION_DAYS * 86400 ))

TOTAL=0
OVER_BYTES=0
OVER_ROWS=0
EXPIRING_NOT_DROPPED=0
B_BYTES=""; B_ROWS=""; B_CUR=""; B_FUT=""; B_EXP=""

# valor de label: escapa barra invertida, aspas e quebra de linha (formato de exposicao)
escapa() { local v="${1//\\/\\\\}"; v="${v//\"/\\\"}"; printf '%s' "${v//$'\n'/\\n}"; }
# epoch <data> — 0 quando o limite nao e uma data (DEFAULT, MINVALUE, MAXVALUE, vazio)
epoch() { [[ -n "$1" ]] || { echo 0; return; }; date -u -d "$1" +%s 2>/dev/null || echo 0; }

while IFS='|' read -r name est_rows total_bytes range_start range_end; do
  [[ -z "$name" ]] && continue
  [[ "${est_rows:-}" =~ ^[0-9]+$ ]] || est_rows=0
  [[ "${total_bytes:-}" =~ ^[0-9]+$ ]] || total_bytes=0
  TOTAL=$((TOTAL + 1))

  start_ts=$(epoch "${range_start:-}")
  end_ts=$(epoch "${range_end:-}")
  is_current=0; is_future=0; is_expiring=0
  (( start_ts > 0 && end_ts > 0 && NOW_TS >= start_ts && NOW_TS < end_ts )) && is_current=1
  (( start_ts > NOW_TS )) && is_future=1
  (( end_ts > 0 && end_ts <= CUTOFF_TS )) && is_expiring=1

  (( total_bytes > BYTES_LIMIT )) && OVER_BYTES=$((OVER_BYTES + 1))
  (( est_rows > ROWS_LIMIT ))     && OVER_ROWS=$((OVER_ROWS + 1))
  (( is_expiring == 1 ))          && EXPIRING_NOT_DROPPED=$((EXPIRING_NOT_DROPPED + 1))

  l="$(escapa "$name")"
  B_BYTES+="aigw_partition_bytes{partition=\"$l\"} $total_bytes"$'\n'
  B_ROWS+="aigw_partition_rows{partition=\"$l\"} $est_rows"$'\n'
  B_CUR+="aigw_partition_is_current{partition=\"$l\"} $is_current"$'\n'
  B_FUT+="aigw_partition_is_future{partition=\"$l\"} $is_future"$'\n'
  B_EXP+="aigw_partition_is_expiring{partition=\"$l\"} $is_expiring"$'\n'
done <<<"$ROWS"

{
  echo "# HELP aigw_partition_bytes Tamanho fisico da particao em bytes"
  echo "# TYPE aigw_partition_bytes gauge"
  printf '%s' "$B_BYTES"
  echo "# HELP aigw_partition_rows Estimativa de linhas (reltuples)"
  echo "# TYPE aigw_partition_rows gauge"
  printf '%s' "$B_ROWS"
  echo "# HELP aigw_partition_is_current 1 se a particao cobre o instante atual"
  echo "# TYPE aigw_partition_is_current gauge"
  printf '%s' "$B_CUR"
  echo "# HELP aigw_partition_is_future 1 se a particao esta no futuro"
  echo "# TYPE aigw_partition_is_future gauge"
  printf '%s' "$B_FUT"
  echo "# HELP aigw_partition_is_expiring 1 se a particao ja passou da janela de retencao"
  echo "# TYPE aigw_partition_is_expiring gauge"
  printf '%s' "$B_EXP"

  if [[ "$UP" -eq 1 ]]; then
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
  fi

  echo "# HELP aigw_partitions_exporter_up 1 se o exporter rodou com sucesso"
  echo "# TYPE aigw_partitions_exporter_up gauge"
  echo "aigw_partitions_exporter_up $UP"

  echo "# HELP aigw_partitions_last_run_timestamp_seconds Ultimo run em unix epoch"
  echo "# TYPE aigw_partitions_last_run_timestamp_seconds gauge"
  echo "aigw_partitions_last_run_timestamp_seconds $NOW_TS"
} >"$TMP_FILE" || { echo "falha ao gravar $TMP_FILE" >&2; exit 1; }

# mktemp cria 0600; o node_exporter roda com outro usuario e precisa ler.
chmod 0644 "$TMP_FILE"
mv -f "$TMP_FILE" "$OUT_FILE" || { echo "falha ao publicar $OUT_FILE" >&2; exit 1; }
[[ "$UP" -eq 1 ]] || exit 2
exit 0
