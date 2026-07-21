-- triggers-parity.sql — Lista canônica de triggers + hash de functions para diff.
-- Uso:
--   psql "$SRC_DB_URL"  -Atqf verify/triggers-parity.sql > verify/triggers-src.txt
--   psql "$DEST_DB_URL" -Atqf verify/triggers-parity.sql > verify/triggers-dest.txt
--   diff -u verify/triggers-src.txt verify/triggers-dest.txt

SELECT
  n.nspname || '.' || c.relname || '::' || t.tgname || '::' ||
  CASE WHEN (t.tgtype & 2) = 2 THEN 'BEFORE' ELSE 'AFTER' END || '::' ||
  array_to_string(ARRAY[
    CASE WHEN (t.tgtype & 4)  = 4  THEN 'INSERT'   END,
    CASE WHEN (t.tgtype & 8)  = 8  THEN 'DELETE'   END,
    CASE WHEN (t.tgtype & 16) = 16 THEN 'UPDATE'   END,
    CASE WHEN (t.tgtype & 32) = 32 THEN 'TRUNCATE' END
  ], ',') || '::' || p.proname
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND n.nspname NOT IN ('pg_catalog','information_schema')
ORDER BY 1;

SELECT '---FUNCTIONS---';

SELECT
  n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')::' ||
  md5(pg_get_functiondef(p.oid))
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
  AND p.prokind = 'f'
ORDER BY 1;