-- extension-upgrade-available-audit.sql — Rodada 24/10 (gap 26)
-- Extensoes com nova versao disponivel porem nao aplicadas via ALTER EXTENSION UPDATE.
\echo '== extension-upgrade-available-audit =='
SELECT e.extname, e.extversion AS installed,
       (SELECT MAX(version)
          FROM pg_available_extension_versions v
         WHERE v.name = e.extname) AS available
  FROM pg_extension e
 WHERE (SELECT MAX(version) FROM pg_available_extension_versions v WHERE v.name=e.extname)
       IS DISTINCT FROM e.extversion
 ORDER BY e.extname;
\echo 'REC: rodar ALTER EXTENSION <name> UPDATE nas divergentes apos smoke test.'