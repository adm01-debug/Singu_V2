#!/usr/bin/env bash
# connection-pool-exhaustion-canary.sh — Rodada 19/10
# Canario: alerta se as conexoes de cliente passam de N% de max_connections.
#
# Uso: DEST_DB_URL=... [THRESHOLD_PCT=80] ./connection-pool-exhaustion-canary.sh
# Contagem: client backends em pg_stat_activity (papel com pg_read_all_stats/superuser);
#           sem esse privilegio, soma de numbackends de pg_stat_database (aproximacao).
# Codigos de saida: 0 = abaixo do limiar; 1 = acima do limiar (WARN + top 10 consumidores);
#                   2 = erro de uso ou consulta falhou. Somente leitura.
set -euo pipefail
export LC_ALL=C

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi
[[ -n "${DEST_DB_URL:-}" ]] || { echo "ERRO: DEST_DB_URL obrigatorio" >&2; exit 2; }
THRESHOLD_PCT="${THRESHOLD_PCT:-80}"
[[ "$THRESHOLD_PCT" =~ ^[0-9]+([.][0-9]+)?$ ]] || { echo "ERRO: THRESHOLD_PCT invalido: $THRESHOLD_PCT" >&2; exit 2; }

echo "== connection-pool-exhaustion-canary (threshold=${THRESHOLD_PCT}%) =="

if ! LINHA=$(PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}" psql "$DEST_DB_URL" -X -Atq -F ' ' -v ON_ERROR_STOP=1 -c "
  WITH c AS (
    SELECT CASE
             WHEN (SELECT rolsuper FROM pg_roles WHERE rolname = current_user)
                  OR pg_has_role(current_user, 'pg_read_all_stats', 'USAGE')
               THEN (SELECT COUNT(*) FROM pg_stat_activity WHERE backend_type = 'client backend')
             ELSE (SELECT COALESCE(SUM(numbackends), 0) FROM pg_stat_database)
           END AS active,
           current_setting('max_connections')::int AS max_conn
  )
  SELECT active, max_conn, ROUND(100.0 * active / NULLIF(max_conn, 0), 1) FROM c;
"); then
  echo "ERRO: consulta ao destino falhou — canario nao avaliado." >&2; exit 2
fi
read -r ACTIVE MAX PCT <<<"$LINHA" || true
if [[ ! "${ACTIVE:-}" =~ ^[0-9]+$ || ! "${MAX:-}" =~ ^[0-9]+$ || ! "${PCT:-}" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "ERRO: resposta inesperada do destino: '$LINHA'" >&2; exit 2
fi

printf 'Conexoes ativas: %s / %s (%s%%)\n' "$ACTIVE" "$MAX" "$PCT"

ALERT=$(awk -v p="$PCT" -v t="$THRESHOLD_PCT" 'BEGIN{print (p+0>t+0)?"1":"0"}')
if [[ "$ALERT" == "1" ]]; then
  echo "WARN: uso de pool ${PCT}% > ${THRESHOLD_PCT}%."
  psql "$DEST_DB_URL" -X -c "
    SELECT usename, application_name, COUNT(*) AS conns
      FROM pg_stat_activity WHERE backend_type = 'client backend'
     GROUP BY 1,2 ORDER BY conns DESC LIMIT 10;
  " || true
  exit 1
fi

echo "OK pool saudavel."
