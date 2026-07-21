-- Lista FKs órfãs em todas as tabelas public. Rode no DESTINO após import.
-- Uso: psql "$DEST_DB_URL" -f verify/fk-integrity.sql
\pset pager off
\timing off

WITH fks AS (
  SELECT
    tc.table_schema, tc.table_name, tc.constraint_name,
    kcu.column_name AS fk_col,
    ccu.table_schema AS ref_schema, ccu.table_name AS ref_table, ccu.column_name AS ref_col
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
)
SELECT
  format(
    'SELECT %L AS table_name, %L AS fk_col, count(*) AS orphans
     FROM public.%I t
     WHERE t.%I IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM %I.%I r WHERE r.%I = t.%I)
     HAVING count(*) > 0',
    table_name, fk_col, table_name, fk_col, ref_schema, ref_table, ref_col, fk_col
  ) || ' UNION ALL '
FROM fks
\gexec

-- Ao final: se nenhum resultado apareceu, tudo íntegro.
SELECT '✔ nenhuma FK órfã detectada' AS resultado
WHERE NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = '__fk_orphans_found__');
