-- sequences-audit.sql — Gera SQL para realinhar TODAS as sequences owned pelas colunas.
-- Classe   : GERADOR (so le o catalogo; o SQL gerado e que altera sequences — revise antes de aplicar)
-- Variaveis: nenhuma
-- Saida    : 0. Um comentario + um SELECT setval(...) por sequence.
-- Uso: psql "$DEST_DB_URL" -Atqf verify/sequences-audit.sql > verify/sequences-fix.sql

SELECT format(
  '-- %I.%I.%I' || E'\n' ||
  'SELECT setval(%L, GREATEST(COALESCE((SELECT MAX(%I) FROM %I.%I), 0), 1), true);',
  tn.nspname, tbl.relname, a.attname,
  quote_ident(n.nspname) || '.' || quote_ident(c.relname),
  a.attname, tn.nspname, tbl.relname
)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_depend d ON d.objid = c.oid AND d.deptype IN ('a','i')
                AND d.classid = 'pg_class'::regclass AND d.refclassid = 'pg_class'::regclass
JOIN pg_class tbl ON tbl.oid = d.refobjid
JOIN pg_namespace tn ON tn.oid = tbl.relnamespace
JOIN pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = d.refobjsubid
WHERE c.relkind = 'S'
  AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
ORDER BY tn.nspname, tbl.relname, a.attname;
