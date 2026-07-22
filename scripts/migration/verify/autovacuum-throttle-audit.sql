-- autovacuum-throttle-audit.sql — Rodada 25/10 (WARN)
-- cost_delay > 20ms estrangula autovacuum em bancos com writes altos.
\echo '== autovacuum-throttle-audit =='
SELECT name, setting, unit FROM pg_settings
 WHERE name IN ('autovacuum_vacuum_cost_delay','autovacuum_vacuum_cost_limit',
                'vacuum_cost_delay','vacuum_cost_limit');
SELECT c.oid::regclass AS rel, c.reloptions
  FROM pg_class c
 WHERE c.relkind='r'
   AND c.reloptions::text ILIKE '%autovacuum_vacuum_cost_delay%';
DO $$
DECLARE v_delay numeric;
BEGIN
  SELECT setting::numeric INTO v_delay FROM pg_settings WHERE name='autovacuum_vacuum_cost_delay';
  IF v_delay > 20 THEN
    RAISE WARNING 'autovacuum_vacuum_cost_delay=%ms > 20ms. Autovacuum pode nao acompanhar writes.', v_delay;
  END IF;
END $$;
\echo 'OK autovacuum throttle auditado.'