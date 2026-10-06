\pset pager off
SELECT count(*) users, max(last_sign_in_at) last_sign_in, max(created_at) last_user FROM auth.users;
SELECT 'interactions' t, max(created_at) FROM public.interactions UNION ALL SELECT 'contacts', max(updated_at) FROM public.contacts UNION ALL SELECT 'deals', max(updated_at) FROM public.deals UNION ALL SELECT 'error_logs', max(created_at) FROM public.error_logs UNION ALL SELECT 'audit_log', max(created_at) FROM public.audit_log;
SELECT count(*) FROM auth.refresh_tokens WHERE created_at > now() - interval '7 days';
SELECT date_trunc('day', created_at)::date d, count(*) FROM auth.audit_log_entries WHERE created_at > now() - interval '14 days' GROUP BY 1 ORDER BY 1;
