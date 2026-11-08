-- check-indexes-unused.sql — Auditoria hardening 26/11.
-- Detecta índices com idx_scan = 0 desde o último reset de estatísticas,
-- em tabelas com >= 1000 linhas estimadas. Índice não usado ainda custa escrita em
-- todo INSERT/UPDATE/DELETE e ocupa espaço (observe storage.objects: ~24 MB em
-- 6 índices sem scan).
-- Risco de falso positivo: idx_scan zera em REINDEX/reset e índices usados só em
-- manutenção/relatórios sazonais passam despercebidos. Decisão de DROP é humana.
\echo '== check-indexes-unused =='
\pset pager off
\set ON_ERROR_STOP on

-- Probe: índices sem scan em tabelas grandes.
SELECT s.schemaname, s.relname AS tabela, s.indexrelname AS indice,
       s.idx_scan, pg_relation_size(s.indexrelid) AS bytes,
       c.reltuples::bigint AS linhas_estimadas
  FROM pg_stat_user_indexes s
  JOIN pg_class c ON c.oid = s.relid
  JOIN pg_index pi ON pi.indexrelid = s.indexrelid
 WHERE s.idx_scan = 0 AND c.reltuples >= 1000
   AND c.relkind = 'r' AND pi.indisvalid
 ORDER BY pg_relation_size(s.indexrelid) DESC;

DO $BODY$
DECLARE
  v_qtd  int := 0;
  v_bytes bigint := 0;
  v_rec  record;
  v_det  text := '';
BEGIN
  FOR v_rec IN
    SELECT s.schemaname, s.relname AS tabela, s.indexrelname AS indice,
           s.idx_scan, pg_relation_size(s.indexrelid) AS bytes, c.reltuples
      FROM pg_stat_user_indexes s
      JOIN pg_class c ON c.oid = s.relid
      JOIN pg_index pi ON pi.indexrelid = s.indexrelid
     WHERE s.idx_scan = 0 AND c.reltuples >= 1000
       AND c.relkind = 'r' AND pi.indisvalid
     ORDER BY pg_relation_size(s.indexrelid) DESC
  LOOP
    v_qtd := v_qtd + 1;
    v_bytes := v_bytes + v_rec.bytes;
    IF length(v_det) < 4000 THEN
      v_det := v_det || E'\n  - ' || v_rec.schemaname || '.' || v_rec.tabela || ': '
                    || v_rec.indice || ' (' || pg_size_pretty(v_rec.bytes) || ')';
    END IF;
  END LOOP;

  IF v_qtd > 0 THEN
    RAISE EXCEPTION 'FATAL: % indices sem uso em tabelas >= 1000 linhas (~% no total).%',
                    v_qtd, pg_size_pretty(v_bytes), v_det;
  END IF;
  RAISE NOTICE 'OK: nenhum indice com idx_scan=0 em tabelas grandes.';
END
$BODY$;
\echo 'OK check-indexes-unused.'
