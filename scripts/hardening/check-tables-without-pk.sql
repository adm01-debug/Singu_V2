-- check-tables-without-pk.sql — Auditoria hardening 26/11.
-- Detecta tabelas sem PRIMARY KEY. Sem PK não há garantia de unicidade de linha,
-- replica lógica fica sem REPLICA IDENTITY adequada e ferramentas de CDC sofrem.
-- Na produção auditada só restaram tabelas de sistema/utilitário sem PK (net.*,
-- ops_backup.acl_snapshot) — nenhuma publicada em realtime, risco de replicação baixo.
\echo '== check-tables-without-pk =='
\pset pager off
\set ON_ERROR_STOP on

-- Probe: tabelas (relkind=r) sem índice PRIMARY, fora schemas de sistema.
SELECT n.nspname AS schema, c.relname AS tabela,
       c.reltuples::bigint AS linhas_estimadas
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE c.relkind = 'r'
   AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
   AND NOT EXISTS (SELECT 1 FROM pg_index i
                    WHERE i.indrelid = c.oid AND i.indisprimary)
 ORDER BY n.nspname, c.relname;

DO $BODY$
DECLARE
  v_qtd int := 0;
  v_rec record;
  v_det text := '';
BEGIN
  FOR v_rec IN
    SELECT n.nspname AS schema, c.relname AS tabela
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r'
       AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
       AND NOT EXISTS (SELECT 1 FROM pg_index i
                        WHERE i.indrelid = c.oid AND i.indisprimary)
     ORDER BY n.nspname, c.relname
  LOOP
    v_qtd := v_qtd + 1;
    IF length(v_det) < 2000 THEN
      v_det := v_det || E'\n  - ' || v_rec.schema || '.' || v_rec.tabela;
    END IF;
  END LOOP;

  IF v_qtd > 0 THEN
    RAISE EXCEPTION 'FATAL: % tabela(s) sem PRIMARY KEY.%', v_qtd, v_det;
  END IF;
  RAISE NOTICE 'OK: todas as tabelas de aplicacao possuem PRIMARY KEY.';
END
$BODY$;
\echo 'OK check-tables-without-pk.'
