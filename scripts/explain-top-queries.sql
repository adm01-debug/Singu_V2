-- explain-top-queries.sql — ranking das consultas mais caras do banco (pg_stat_statements).
--
-- Propósito: listar as N consultas que mais consomem tempo total, para escolher o que
--   analisar com EXPLAIN (use `python3 scripts/run_explain_analyze.py --top-queries N`,
--   que chama este arquivo, ou `--query-file` com as consultas escolhidas).
-- Uso:
--   psql "$SUPABASE_DB_URL" -X -f scripts/explain-top-queries.sql            # top 20
--   psql "$SUPABASE_DB_URL" -X -v top=50 --csv -f scripts/explain-top-queries.sql
-- Risco: nenhum — somente leitura. Só entram comandos de dados (SELECT/WITH/INSERT/UPDATE/
--   DELETE/MERGE) do banco atual: comandos utilitários ficam de fora porque o texto deles não
--   é normalizado e pode conter segredo (ex.: ALTER ROLE ... PASSWORD).
-- Saída: uma única tabela no stdout (colunas estáveis; `queryid` no fim). Sai com código 3 e
--   a mensagem "pg_stat_statements indisponivel: ..." se a extensão não estiver instalada ou
--   carregada. Sem o papel pg_read_all_stats, consultas de outros usuários não aparecem.
\set ON_ERROR_STOP on
\if :{?top}
\else
  \set top 20
\endif
SELECT set_config('singu.top', :'top', false) \gset _cfg_

DO $guarda$
DECLARE
  v_top    text := current_setting('singu.top');
  v_schema text;
BEGIN
  IF v_top !~ '^[0-9]{1,4}$' OR v_top::int NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'parametro invalido: -v top=% (use um inteiro de 1 a 1000).', v_top;
  END IF;
  SELECT n.nspname INTO v_schema
    FROM pg_catalog.pg_extension e
    JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'pg_stat_statements';
  IF v_schema IS NULL THEN
    RAISE EXCEPTION 'pg_stat_statements indisponivel: extensao nao instalada neste banco.';
  END IF;
  BEGIN
    EXECUTE format('SELECT 1 FROM %I.pg_stat_statements LIMIT 1', v_schema);
  EXCEPTION WHEN object_not_in_prerequisite_state OR insufficient_privilege THEN
    RAISE EXCEPTION 'pg_stat_statements indisponivel: %', SQLERRM;
  END;
END
$guarda$;

SELECT quote_ident(n.nspname) AS pgss_schema
  FROM pg_catalog.pg_extension e
  JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
 WHERE e.extname = 'pg_stat_statements' \gset

WITH comandos AS (
  SELECT s.queryid, s.calls, s.total_exec_time, s.mean_exec_time,
         -- tira comentários iniciais e achata espaços para classificar e exibir
         regexp_replace(
           regexp_replace(s.query, '^(\s*(/\*.*?\*/|--[^\n]*(\n|$)))*\s*', ''), '\s+', ' ', 'g') AS texto
    FROM :pgss_schema.pg_stat_statements s
   WHERE s.dbid = (SELECT d.oid FROM pg_catalog.pg_database d WHERE d.datname = current_database())
)
SELECT left(texto, 100) AS short_query,
       round(total_exec_time::numeric, 2) AS total_time,
       calls,
       round(mean_exec_time::numeric, 2) AS mean_time,
       round((100 * total_exec_time / NULLIF(sum(total_exec_time) OVER (), 0))::numeric, 2) AS percentage_of_load,
       queryid
  FROM comandos
 WHERE texto ~* '^(select|with|insert|update|delete|merge)\M'
 ORDER BY total_exec_time DESC, queryid
 LIMIT :top;
