-- synchronous-commit-drift-audit.sql — Rodada 24/10 (gap 23)
-- Drift de synchronous_commit por role/database pode causar perda de commits em crash.
\echo '== synchronous-commit-drift-audit =='
SELECT name, setting, source, sourcefile, sourceline
  FROM pg_settings
 WHERE name = 'synchronous_commit';
SELECT r.rolname, s.setconfig
  FROM pg_db_role_setting s
  JOIN pg_roles r ON r.oid = s.setrole
 WHERE EXISTS (SELECT 1 FROM unnest(s.setconfig) c WHERE c LIKE 'synchronous_commit=%');
\echo 'REC: cluster deve usar on ou remote_apply em prod. Overrides por role sao suspeitos.'