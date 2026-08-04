-- superuser-count-audit.sql — Rodada 22/10
\echo '== superuser-count-audit =='
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls
  FROM pg_roles
 WHERE rolsuper = true OR rolbypassrls = true
 ORDER BY rolname;
\echo 'REC: minimizar superusers; usar roles com CREATEDB/REPLICATION granular.'