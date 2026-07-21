-- Timezone & Locale Drift Guard — compara timezone, lc_collate, lc_ctype, server_encoding.
-- Uso:
--   psql "$SRC_DB_URL"  -Atqc "$(cat verify/tz-locale-parity.sql)" > /tmp/locale-src.txt
--   psql "$DEST_DB_URL" -Atqc "$(cat verify/tz-locale-parity.sql)" > /tmp/locale-dst.txt
--   diff /tmp/locale-src.txt /tmp/locale-dst.txt
-- Divergência em lc_collate corrompe ORDER BY silenciosamente.
SELECT string_agg(k || '=' || v, E'\n' ORDER BY k)
  FROM (
    SELECT 'timezone'        AS k, current_setting('TimeZone')       AS v
    UNION ALL SELECT 'lc_collate',      current_setting('lc_collate')
    UNION ALL SELECT 'lc_ctype',        current_setting('lc_ctype')
    UNION ALL SELECT 'server_encoding', current_setting('server_encoding')
    UNION ALL SELECT 'server_version',  current_setting('server_version')
    UNION ALL SELECT 'default_text_search_config', current_setting('default_text_search_config')
  ) t;