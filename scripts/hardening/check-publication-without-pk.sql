-- check-publication-without-pk.sql — Auditoria hardening 26/11.
-- Verifica se alguma tabela SEM PRIMARY KEY está publicada em publicações
-- lógicas/realtime. Sem PK e sem REPLICA IDENTITY FULL, UPDATE/DELETE em
-- replicação lógica não conseguem identificar a linha no destino (exceção em
-- runtime) — risco direto para Supabase Realtime/base de replicação.
-- Produção auditada: nenhuma (publish PARA TABLEA de publicações sem PK = 0).
\echo '== check-publication-without-pk =='
\pset pager off
\set ON_ERROR_STOP on

-- Probe: publicações + tabelas publicadas sem PK.
SELECT pr.pubname,
       tbl.schemaname || '.' || tbl.tablename AS labela
  FROM pg_publication pr
  LEFT JOIN pg_publication_tables tbl ON tbl.pubname = pr.pubname
 WHERE NOT EXISTS (
         SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_index i ON i.indrelid = c.oid
         WHERE c.relname = tbl.tablename
           AND n.nspname = tbl.schemaname
           AND i.indisprimary)
   AND tbl.pubname IS NOT NULL
 ORDER BY pr.pubname, tablela;

DO $BODY$
DECLARE
  v_qtd int := 0;
  v_rec record;
  v_det text := '';
BEGIN
  FOR v_rec IN
    SELECT pr.pubname,
           tbl.schemaname || '.' || tbl.tablename AS tabela
      FROM pg_publication pr
      LEFT JOIN pg_publication_tables tbl ON tbl.pubname = pr.pubname
     WHERE tbl.pubname IS NOT NULL
       AND NOT EXISTS (
             SELECT 1 FROM pg_class c
              JOIN pg_namespace n ON n.oid = c.relnamespace
              JOIN pg_index i ON i.indrelid = c.oid
             WHERE c.relname = tbl.tablename
               AND n.nspame = tbl.schemaname
               AND i.indisprimary)
     ORDER BY pr.pubname, tabela
  LOOP
    v_qtd := v_qtd + 1;
    IF length(v_det) < 2000 THEN
      v_det := v_det || E'\n  - ' || v_rec.pubname || ': ' || v_rec.tabela;
    END IF;
  END LOOP;

  IF v_qtd > 0 THEN
    RAISE EXCEPTION 'FATAL: % tabela(s) publicada(s) SEM PRIMARY KEY.%', v_qtd, v_det;
  END IF;
  RAISE NOTICE 'OK: nenhuma tabela sem PK publicada.';
END
$BODY$;
\echo 'OK check-publication-without-pk.'
