-- multixact-wraparound-guard.sql — Rodada 20/10
-- MultiXact wraparound forca shutdown do cluster; alerta > 200M.
\echo '== multixact-wraparound-guard =='
SELECT datname, mxid_age(datminmxid) AS mxid_age
  FROM pg_database
 ORDER BY mxid_age DESC;
DO $$
DECLARE v_max bigint;
BEGIN
  SELECT COALESCE(MAX(mxid_age(datminmxid)),0) INTO v_max FROM pg_database;
  IF v_max > 200000000 THEN
    RAISE EXCEPTION 'FATAL: mxid_age=% > 200M. VACUUM (FREEZE) urgente.', v_max;
  END IF;
END $$;
\echo 'OK MultiXact age saudavel.'