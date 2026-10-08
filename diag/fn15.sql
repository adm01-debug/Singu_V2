\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
SELECT 'CHK|' || conname || '|' || pg_get_constraintdef(c.oid)
FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace
WHERE n.nspname='public' AND t.relname='reminders' AND c.contype='c'
ORDER BY conname;
