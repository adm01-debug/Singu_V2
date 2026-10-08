\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
SELECT 'ENUM|' || t.typname || '|' || e.enumlabel
FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace
WHERE n.nspname='public' AND t.typname IN ('email_type','phone_type','company_status')
ORDER BY t.typname, e.enumsortorder;
SELECT 'TYP|' || t.typname || '|' || t.typtype FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname LIKE '%email%';
SELECT 'COL|' || table_name || '|' || column_name || '|' || data_type || '|' || udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('contact_emails','company_emails') ORDER BY table_name, ordinal_position;
