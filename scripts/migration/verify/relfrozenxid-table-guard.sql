-- relfrozenxid-table-guard.sql — Rodada 22/10
\echo '== relfrozenxid-table-guard =='
SELECT n.nspname, c.relname,
       age(c.relfrozenxid) AS xid_age,
       pg_size_pretty(pg_relation_size(c.oid)) AS size
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE c.relkind IN ('r','m','t')
   AND age(c.relfrozenxid) > 500000000
 ORDER BY age(c.relfrozenxid) DESC
 LIMIT 30;
DO $$
DECLARE v_max bigint;
BEGIN
  SELECT COALESCE(MAX(age(relfrozenxid)),0) INTO v_max
    FROM pg_class WHERE relkind IN ('r','m','t');
  IF v_max > 1500000000 THEN
    RAISE EXCEPTION 'FATAL: relfrozenxid age max=% > 1.5B. VACUUM FREEZE por tabela.', v_max;
  END IF;
END $$;
\echo 'OK relfrozenxid saudavel.'