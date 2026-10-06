\pset pager off
\echo ### triggers_publicas
SELECT c.relname||'|'||t.tgname||'|'||p.oid::regprocedure::text||'|'||p.prosecdef::text FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_proc p ON p.oid=t.tgfoid WHERE NOT t.tgisinternal AND c.relnamespace='public'::regnamespace AND c.relname IN ('landing_page_submissions','csat_surveys','document_signatures','forms','lead_magnets','landing_pages','lead_magnet_downloads','form_submissions') ORDER BY 1,2;
\echo ### tokens
SELECT 'csat', count(*), count(*) FILTER (WHERE public_token IS NOT NULL), count(*) FILTER (WHERE status='sent') FROM public.csat_surveys;
SELECT 'docsig', count(*), count(*) FILTER (WHERE signature_token IS NOT NULL) FROM public.document_signatures;
SELECT 'lm', count(*), count(*) FILTER (WHERE is_published) FROM public.lead_magnets;
\echo ### deal_room_fn
SELECT pg_get_functiondef('public.get_deal_room_by_token(text)'::regprocedure);
\echo ### anon_policy_funcs
SELECT DISTINCT p.tablename||'|'||m[1] FROM pg_policies p, regexp_matches(coalesce(p.qual,'')||' '||coalesce(p.with_check,''), '([a-z_][a-z0-9_]*)\(', 'g') m WHERE p.schemaname='public' AND p.tablename IN ('forms','lead_magnets','landing_pages','landing_page_submissions','csat_surveys','document_signatures') ORDER BY 1;
