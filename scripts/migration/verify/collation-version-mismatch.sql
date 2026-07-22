-- collation-version-mismatch.sql — Rodada 25/10 (FATAL)
-- Upgrade de glibc muda ordenacao de strings; indices btree ficam corrompidos
-- silenciosamente ate REINDEX. Detecta drift entre versao registrada e atual.
\echo '== collation-version-mismatch =='
SELECT datname, datcollate, datcollversion,
       pg_database_collation_actual_version(oid) AS actual_version
  FROM pg_database
 WHERE datallowconn
   AND datcollversion IS NOT NULL
   AND datcollversion <> pg_database_collation_actual_version(oid);
SELECT collname, collnamespace::regnamespace, collversion,
       pg_collation_actual_version(oid) AS actual_version
  FROM pg_collation
 WHERE collversion IS NOT NULL
   AND collversion <> pg_collation_actual_version(oid);
DO $$
DECLARE v_db int; v_col int;
BEGIN
  SELECT count(*) INTO v_db FROM pg_database
   WHERE datallowconn AND datcollversion IS NOT NULL
     AND datcollversion <> pg_database_collation_actual_version(oid);
  SELECT count(*) INTO v_col FROM pg_collation
   WHERE collversion IS NOT NULL
     AND collversion <> pg_collation_actual_version(oid);
  IF v_db + v_col > 0 THEN
    RAISE EXCEPTION 'FATAL: collation drift em % db(s) e % collation(s). REINDEX + ALTER DATABASE/COLLATION REFRESH VERSION.', v_db, v_col;
  END IF;
END $$;
\echo 'OK sem collation drift.'