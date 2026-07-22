-- datfrozenxid-age-guard.sql — Rodada 20/10
-- age(datfrozenxid) > 1B = risco iminente de xid wraparound (shutdown forcado a 2B).
\echo '== datfrozenxid-age-guard =='
SELECT datname, age(datfrozenxid) AS xid_age
  FROM pg_database
 ORDER BY xid_age DESC;
DO $$
DECLARE v_max bigint;
BEGIN
  SELECT COALESCE(MAX(age(datfrozenxid)),0) INTO v_max FROM pg_database;
  IF v_max > 1000000000 THEN
    RAISE EXCEPTION 'FATAL: datfrozenxid age=% > 1B. VACUUM FREEZE global urgente.', v_max;
  END IF;
END $$;
\echo 'OK datfrozenxid saudavel.'