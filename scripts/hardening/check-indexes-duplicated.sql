-- check-indexes-duplicated.sql — Auditoria hardening 26/11.
-- Detecta índices DUPLICADOS: mesmas colunas, mesmo access method e mesma ordem,
-- na mesma tabela (ex.: btree(company_id) aparecendo 2x). Cada cópia dobra o
-- custo de escrita e ocupa espaço sem benefício de leitura.
-- Exemplo real (produção): companies_pkey, idx_companies_active e idx_companies_ativo
-- são todos btree {id} — 3 índices idênticos na mesma tabela.
-- Overlap parcial (prefixo) é tratado no check-indexes-overlapped.sql.
\echo '== check-indexes-duplicated =='
\pset pager off
\set ON_ERROR_STOP on

-- Probe: pares de índices com colunas idênticas e mesmo método.
WITH idx AS (
  SELECT pi.indexrelid, pi.indrelid, am.amname AS metodo,
         t.oid::regclass::text AS tabela,
         c.relname AS indice,
         array_agg(att.attname ORDER BY k.ord)
           FILTER (WHERE att.attname IS NOT NULL) AS colunas
    FROM pg_index pi
    JOIN pg_class c ON c.oid = pi.indexrelid
    JOIN pg_class t ON t.oid = pi.indrelid
    JOIN pg_am am ON am.oid = c.relam
    CROSS JOIN LATERAL unnest(pi.indkey) WITH ORDINALITY AS k(attnum, ord)
    LEFT JOIN pg_attribute att ON att.attrelid = pi.indrelid AND att.attnum = k.attnum
   WHERE pi.indisvalid
   GROUP BY pi.indexrelid, pi.indrelid, am.amname, t.oid, c.relname
)
SELECT a.tabela,
       a.metodo || ':' || a.indice AS indice_a,
       b.metodo || ':' || b.indice AS indice_b
  FROM idx a
  JOIN idx b ON a.indrelid = b.indrelid AND a.indexrelid < b.indexrelid
 WHERE a.colunas = b.colunas AND a.metodo = b.metodo
 ORDER BY a.tabela, a.indice;

DO $BODY$
DECLARE
  v_pares int := 0;
  v_det   text := '';
  v_rec   record;
BEGIN
  FOR v_rec IN
    WITH idx AS (
      SELECT pi.indexrelid, pi.indrelid, am.amname AS metodo,
             t.oid::regclass::text AS tabela, c.relname AS indice,
             array_agg(att.attname ORDER BY k.ord)
               FILTER (WHERE att.attname IS NOT NULL) AS colunas
        FROM pg_index pi
        JOIN pg_class c ON c.oid = pi.indexrelid
        JOIN pg_class t ON t.oid = pi.indrelid
        JOIN pg_am am ON am.oid = c.relam
        CROSS JOIN LATERAL unnest(pi.indkey) WITH ORDINALITY AS k(attnum, ord)
        LEFT JOIN pg_attribute att ON att.attrelid = pi.indrelid AND att.attnum = k.attnum
       WHERE pi.indisvalid
       GROUP BY pi.indexrelid, pi.indrelid, am.amname, t.oid, c.relname
    )
    SELECT a.tabela, a.metodo || ':' || a.indice AS indice_a,
           b.metodo || ':' || b.indice AS indice_b
      FROM idx a
      JOIN idx b ON a.indrelid = b.indrelid AND a.indexrelid < b.indexrelid
     WHERE a.colunas = b.colunas AND a.metodo = b.metodo
     ORDER BY a.tabela, a.indice
  LOOP
    v_pares := v_pares + 1;
    IF length(v_det) < 4000 THEN
      v_det := v_det || E'\n  - ' || v_rec.tabela || ': ' || v_rec.indice_a || ' == ' || v_rec.indice_b;
    END IF;
  END LOOP;

  IF v_pares > 0 THEN
    RAISE EXCEPTION 'FATAL: % par(es) de indices DUPLICADOS (mesmas colunas, mesmo metodo).%', v_pares, v_det;
  END IF;
  RAISE NOTICE 'OK: nenhum indice com colunas identicas e mesmo metodo na mesma tabela.';
END
$BODY$;
\echo 'OK check-indexes-duplicated.'
