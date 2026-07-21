-- sequences-audit.sql — Gera SQL para realinhar TODAS as sequences owned pelas colunas.
-- Uso: psql "$DEST_DB_URL" -Atqf verify/sequences-audit.sql > verify/sequences-fix.sql

SELECT format(
  '-- %I.%I.%I' || E'\n' ||
  'SELECT setval(%L, GREATEST(COALESCE((SELECT MAX(%I) FROM %I.%I), 0), 1), true);',
  n.nspname, tbl.relname, a.attname,
  n.nspname || '.' || c.relname,
  a.attname, n.nspname, tbl.relname
)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_depend d ON d.objid = c.oid AND d.deptype IN ('a','i')
JOIN pg_class tbl ON tbl.oid = d.refobjid
JOIN pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = d.refobjsubid
WHERE c.relkind = 'S'
  AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
ORDER BY n.nspname, tbl.relname;