\pset pager off
\echo ### anon_tabelas_com_grant
SELECT count(DISTINCT c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND (has_table_privilege('anon',c.oid,'SELECT') OR has_table_privilege('anon',c.oid,'INSERT') OR has_table_privilege('anon',c.oid,'UPDATE') OR has_table_privilege('anon',c.oid,'DELETE'));
\echo ### anon_policies_efetivas (tabela|cmd|roles|qual|check)
SELECT p.tablename||'|'||p.cmd||'|'||array_to_string(p.roles,',')||'|'||coalesce(p.qual,'')||'|'||coalesce(p.with_check,'') FROM pg_policies p WHERE p.schemaname='public' AND (p.roles && ARRAY['anon','public']::name[]) AND has_table_privilege('anon', ('public.'||quote_ident(p.tablename))::regclass, CASE WHEN p.cmd IN ('ALL','SELECT') THEN 'SELECT' WHEN p.cmd='INSERT' THEN 'INSERT' WHEN p.cmd='UPDATE' THEN 'UPDATE' ELSE 'DELETE' END) ORDER BY 1;
\echo ### auth_trunc_ref_trig
SELECT priv, count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace, LATERAL (VALUES ('TRUNCATE'),('REFERENCES'),('TRIGGER')) v(priv) WHERE n.nspname='public' AND c.relkind='r' AND has_table_privilege('authenticated',c.oid,priv) GROUP BY 1;
SELECT priv, count(*) AS anon FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace, LATERAL (VALUES ('TRUNCATE'),('REFERENCES'),('TRIGGER')) v(priv) WHERE n.nspname='public' AND c.relkind='r' AND has_table_privilege('anon',c.oid,priv) GROUP BY 1;
\echo ### service_only (tabela|sel|ins|upd|del)
SELECT t||'|'||has_table_privilege('authenticated','public.'||t,'SELECT')||'|'||has_table_privilege('authenticated','public.'||t,'INSERT')||'|'||has_table_privilege('authenticated','public.'||t,'UPDATE')||'|'||has_table_privilege('authenticated','public.'||t,'DELETE') FROM unnest(ARRAY['cron_secrets','audit_log','error_logs','login_attempts','webauthn_credentials','password_reset_requests','behavioral_profile_regen_queue','incoming_webhook_dlq','system_config','secret_rotation_log','lead_score_history']) t WHERE to_regclass('public.'||t) IS NOT NULL;
\echo ### publicas (tabela|anon sel,ins,upd,del|rls)
SELECT t||'|'||has_table_privilege('anon','public.'||t,'SELECT')||','||has_table_privilege('anon','public.'||t,'INSERT')||','||has_table_privilege('anon','public.'||t,'UPDATE')||','||has_table_privilege('anon','public.'||t,'DELETE')||'|'||(SELECT relrowsecurity FROM pg_class WHERE oid=('public.'||t)::regclass) FROM unnest(ARRAY['forms','lead_magnets','landing_pages','landing_page_submissions','form_submissions','lead_magnet_downloads','deal_rooms','deal_room_activities','deal_room_comments','deal_room_documents','deal_room_milestones','deal_room_stakeholders','csat_surveys','document_signatures']) t WHERE to_regclass('public.'||t) IS NOT NULL;
\echo ### policies_publicas (tabela|nome|cmd|roles|qual)
SELECT tablename||'|'||policyname||'|'||cmd||'|'||array_to_string(roles,',')||'|'||coalesce(qual,'')||'|'||coalesce(with_check,'') FROM pg_policies WHERE schemaname='public' AND tablename IN ('forms','lead_magnets','landing_pages','deal_rooms','landing_page_submissions') ORDER BY 1,2;
\echo ### funcoes_exec
SELECT count(*) FILTER (WHERE has_function_privilege('authenticated',p.oid,'EXECUTE')) AS auth, count(*) FILTER (WHERE has_function_privilege('anon',p.oid,'EXECUTE')) AS anon, count(*) AS total FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f';
\echo ### funcoes_em_policies
SELECT DISTINCT m[1] FROM pg_policies p, regexp_matches(coalesce(p.qual,'')||' '||coalesce(p.with_check,''), '([a-z_][a-z0-9_]*)\(', 'g') m WHERE p.schemaname IN ('public','storage') ORDER BY 1;
\echo ### ai_gateway
SELECT relname FROM pg_class WHERE relname ILIKE '%ai_gateway%';
SELECT p.oid::regprocedure FROM pg_proc p WHERE proname ILIKE '%ai_gateway%';
\echo ### secdef_detalhe (sig|anon|auth|usa_authuid|search_path)
SELECT p.oid::regprocedure||'|'||has_function_privilege('anon',p.oid,'EXECUTE')||'|'||has_function_privilege('authenticated',p.oid,'EXECUTE')||'|'||(position('auth.uid()' in p.prosrc)>0)||'|'||coalesce(array_to_string(p.proconfig,';'),'') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f' AND p.prosecdef ORDER BY 1;
