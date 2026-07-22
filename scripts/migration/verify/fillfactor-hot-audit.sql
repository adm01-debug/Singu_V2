-- fillfactor-hot-audit.sql — Rodada 21/10
\echo '== fillfactor-hot-audit =='
SELECT n.nspname, c.relname,
       COALESCE((SELECT option_value FROM pg_options_to_table(c.reloptions)
                  WHERE option_name='fillfactor'), '100') AS fillfactor,
       pg_size_pretty(pg_relation_size(c.oid)) AS size
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname='public' AND c.relkind='r'
   AND pg_relation_size(c.oid) > 100*1024*1024  -- > 100MB
 ORDER BY pg_relation_size(c.oid) DESC
 LIMIT 30;
\echo 'REC: tabelas com muitos UPDATEs beneficiam de fillfactor 80-90 (HOT updates).'