-- extension-minor-version-parity.sql — Rodada 20/10
\echo '== extension-minor-version-parity =='
SELECT e.extname, e.extversion AS installed,
       (SELECT MAX(version) FROM pg_available_extension_versions v
         WHERE v.name = e.extname) AS latest_available
  FROM pg_extension e
 ORDER BY e.extname;
\echo 'REC: rodar em SRC e DEST; diff em extversion pode alterar planner.'