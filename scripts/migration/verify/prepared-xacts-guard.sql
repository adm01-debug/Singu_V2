-- prepared-xacts-guard.sql — Rodada 17/10
-- Two-phase commits abandonados retem WAL e bloqueiam VACUUM ate wraparound.
\echo '== prepared-xacts-guard =='
SELECT gid, prepared, owner, database, now() - prepared AS age
  FROM pg_prepared_xacts ORDER BY prepared;
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_prepared_xacts WHERE prepared < now() - interval '1 hour';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % prepared transactions orfaos (>1h). ROLLBACK PREPARED urgente.', v_count;
  END IF;
END $$;
\echo 'OK sem 2PC orfaos.'