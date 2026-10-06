\pset pager off
\echo ### triggers_publicas
SELECT c.relname||'|'||t.tgname||'|'||p.oid::regprocedure::text||'|'||p.prosecdef::text AS x FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_proc p ON p.oid=t.tgfoid WHERE NOT t.tgisinternal AND c.relnamespace='public'::regnamespace AND c.relname IN ('landing_page_submissions','csat_surveys','forms','lead_magnets','landing_pages') ORDER BY 1;
\echo ### fks
SELECT conrelid::regclass::text||'|'||conname||'|'||pg_get_constraintdef(oid) FROM pg_constraint WHERE contype='f' AND conrelid IN ('public.contacts'::regclass,'public.user_roles'::regclass,'public.contact_behavior'::regclass) ORDER BY 1;
\echo ### cols
SELECT table_name||'|'||string_agg(column_name||':'||data_type||':'||is_nullable||':'||coalesce(column_default,''), ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('landing_pages','csat_surveys','contact_behavior','user_roles') GROUP BY table_name;
\echo ### buyer_guard
SELECT p.proname||'|'||(position('share_enabled' in p.prosrc)>0)::text||'|'||(position('auth.uid()' in p.prosrc)>0)::text FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname IN ('buyer_add_comment','buyer_toggle_milestone','get_buyer_document_path','get_deal_room_by_token','record_buyer_view');
\echo ### misc
SELECT to_regprocedure('public.execute_readonly_query(text)')::text, to_regprocedure('public.user_can_access_contact(uuid,uuid)')::text;
SELECT policyname||'|'||cmd||'|'||coalesce(qual,'')||'|'||coalesce(with_check,'') FROM pg_policies WHERE schemaname='public' AND tablename IN ('contact_behavior','csat_surveys') ORDER BY 1;
SELECT count(*) AS admins FROM public.user_roles WHERE role='admin';
SELECT p.oid::regprocedure::text FROM pg_proc p WHERE p.proname IN ('user_can_access_contact','has_role') AND p.pronamespace='public'::regnamespace;
