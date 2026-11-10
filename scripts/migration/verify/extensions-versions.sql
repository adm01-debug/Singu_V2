-- Extension Version Parity — gera JSON com {ext, version} para diff origem × destino.
-- Uso:
--   psql "$SRC_DB_URL"  -Atqc "$(cat verify/extensions-versions.sql)" > /tmp/ext-src.json
--   psql "$DEST_DB_URL" -Atqc "$(cat verify/extensions-versions.sql)" > /tmp/ext-dst.json
--   diff <(jq -S . /tmp/ext-src.json) <(jq -S . /tmp/ext-dst.json)
-- Falha (via wrapper): qualquer extensão CRÍTICA com versão divergente.
-- Classe   : SNAPSHOT (SQL puro, sem meta-comandos: e consumido via psql -Atqc "$(cat ...)")
-- Saida    : um objeto JSON {extensao: versao}; vazio/NULL se nenhuma das criticas esta instalada.
SELECT jsonb_object_agg(extname, extversion ORDER BY extname)
  FROM pg_extension
 WHERE extname IN (
   'pg_cron','pgcrypto','pg_net','vector','pgjwt','pg_stat_statements',
   'uuid-ossp','pg_trgm','citext','plpgsql','postgis','wrappers','http'
 );