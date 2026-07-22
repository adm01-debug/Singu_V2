#!/usr/bin/env bash
# connection-pool-exhaustion-canary.sh — Rodada 19/10
# Canario: alerta se pg_stat_activity > 80% de max_connections.
set -euo pipefail

: "${DEST_DB_URL:?DEST_DB_URL obrigatorio}"
THRESHOLD_PCT="${THRESHOLD_PCT:-80}"

echo "== connection-pool-exhaustion-canary (threshold=${THRESHOLD_PCT}%) =="

read -r ACTIVE MAX PCT < <(psql "$DEST_DB_URL" -Atc "
  SELECT
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state IS NOT NULL) AS active,
    (SELECT setting::int FROM pg_settings WHERE name='max_connections') AS max_conn,
    ROUND(100.0 * (SELECT COUNT(*) FROM pg_stat_activity WHERE state IS NOT NULL) /
          (SELECT setting::int FROM pg_settings WHERE name='max_connections'), 1) AS pct;
" | tr '|' ' ')

printf 'Conexoes ativas: %s / %s (%s%%)\n' "$ACTIVE" "$MAX" "$PCT"

ALERT=$(awk -v p="$PCT" -v t="$THRESHOLD_PCT" 'BEGIN{print (p>t)?"1":"0"}')
if [[ "$ALERT" == "1" ]]; then
  echo "WARN: uso de pool ${PCT}% > ${THRESHOLD_PCT}%."
  psql "$DEST_DB_URL" -c "
    SELECT usename, application_name, COUNT(*) AS conns
      FROM pg_stat_activity WHERE state IS NOT NULL
     GROUP BY 1,2 ORDER BY conns DESC LIMIT 10;
  "
fi

echo "OK pool saudavel."