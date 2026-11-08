-- check-indexes-overlapped.sql — Auditoria hardening 26/11.
-- Detecta índices SOBREPOSTOS: um índice é prefixo de outro na mesma tabela.
-- O índice maior torna o menor parcialmente redundante (custo de escrita dobrado).
-- Atenção: sobreposição por prevalência NÃO inclui casos onde o índice menor tem
-- cláusula WHERE (parcial) ou opclass diferente.
\echo '== check-indexes-overlapped =='
\pset pager off
\set ON_ERROR_STOP on

-- Probe: pares em que um índice é prefixo do outro (mesma ordem de colunas).
WITH idx AS (
  SELECT pi.indexrelid, pi.indrelid,
         t.oid::regclass::text AS tabela,
         c.relname AS indice,
         array_agg(att.attname ORDER BY k.ord)
           FILTER (WHERE att.attname IS NOT NULL) AS colunas
    FROM pg_index pi
    JOIN pg_class c ON c.oid = pi.indexrelid
    JOIN pg_class t ON t.oid = pi.indrelid
    CROSS JOIN LATERAL unnest(pi.indkey) WITH ORDINALITY AS k(attnum, ord)
    LEFT JOIN pg_attribute att ON att.attrelid = pi.indrelid AND att.attnum = k.attnum
   WHERE pi.indisvalid
   GROUP BY pi.indexrelid, pi.indrelid, t.oid, c.relname
)
SELECT a.tabela, a.indice || ' (prefixo)  -> ' || b.indice AS par
  FROM idx a
  JOIN idx b ON a.indrelid = b.indrelid AND a.indexrelid <> b.indexrelid
 WHERE array_length(a.colunas, 1) < array_length(b.colunas, 1)
   AND b.colunas[1:array_length(a.colunas, 1)] = a.colunas
 ORDER BY a.tabela, a.indice;

DO $BODY$
DECLARE
  v_pares int := 0;
  v_det   text := '';
  v_rec   record;
BEGIN
  FOR v_rec IN
    WITH idx AS (
      SELECT pi.indexrelid, pi.indrelid,
             t.oid::regclass::text AS tabela, c.relname AS indice,
             array_agg(att.attname ORDER BY k.ord)
               FILTER (WHERE att.attname IS NOT NULL) AS colunas
        FROM pg_index pi
        JOIN pg_class c ON c.oid = pi.indexrelid
        JOIN pg_class t ON t.oid = pi.indrelid
        CROSS JOIN LATERAL unnest(pi.indkey) WITH ORDINALITY AS k(attnum, ord)
        LEFT JOIN pg_attribute att ON att.attrelid = pi.indrelid AND att.attnum = k.attnum
       WHERE pi.indisvalid
       GROUP BY pi.indexrelid, pi.indrelid, t.oid, c.relname
    )
    SELECT a.tabela, a.indice AS indice_a, b.indice AS indice_b
      FROM idx a
      JOIN idx b ON a.indrelid = b.indrelid AND a.indexrelid <> b.indexrelid
     WHERE array_length(a.colunas, 1) < array_length(b.colunas, 1)
       AND b.colunas[1:array_length(a.colunas, 1)] = a.colunas
     ORDER BY a.tabela, a.indice
  LOOP
    v_pares := v_pares + 1;
    IF length(v_det) < 4000 THEN
      v_det := v_det || E'\n  - ' || v_rec.tabela || ': ' || v_rec.indice_a || ' (prefixo) -> ' || v_rec.indice_b;
    END IF;
  END LOOP;

  IF v_pares > 0 THEN
    RAISE EXCEPTION 'FATAL: % par(es) de indices SOBREPOSTOS (prefixo).%', v_pares, v_det;
  END IF;
  RAISE NOTICE 'OK: nenhum indice que seja prefixo de outro na mesma tabela.';
END
$BODY$;
\echo 'OK check-indexes-overlapped.'
