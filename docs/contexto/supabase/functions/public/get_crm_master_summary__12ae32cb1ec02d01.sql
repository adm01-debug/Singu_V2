CREATE OR REPLACE FUNCTION public.get_crm_master_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'crm_name', 'Singu CRM',
    'version', '2.0.0',
    'generated_at', NOW(),
    'totals', jsonb_build_object(
      'companies', (SELECT COUNT(*) FROM companies),
      'active_companies', (SELECT COUNT(*) FROM companies WHERE status = 'ativo'),
      'contacts', (SELECT COUNT(*) FROM contacts),
      'interactions', (SELECT COUNT(*) FROM interactions),
      'users', (SELECT COUNT(*) FROM profiles),
      'functions', (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f')
    ),
    'today', jsonb_build_object(
      'interactions', (SELECT COUNT(*) FROM interactions WHERE created_at::date = CURRENT_DATE),
      'new_companies', (SELECT COUNT(*) FROM companies WHERE created_at::date = CURRENT_DATE),
      'new_contacts', (SELECT COUNT(*) FROM contacts WHERE created_at::date = CURRENT_DATE)
    ),
    'this_month', jsonb_build_object(
      'interactions', (SELECT COUNT(*) FROM interactions WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
      'new_companies', (SELECT COUNT(*) FROM companies WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
      'active_users', (SELECT COUNT(DISTINCT user_id) FROM interactions WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))
    ),
    'health', jsonb_build_object(
      'companies_with_contact', (SELECT COUNT(*) FROM companies c WHERE EXISTS (SELECT 1 FROM contacts ct WHERE ct.company_id = c.id)),
      'companies_with_interaction', (SELECT COUNT(DISTINCT company_id) FROM interactions),
      'positive_sentiment_rate', (
        SELECT ROUND(COUNT(*) FILTER (WHERE sentiment = 'positive')::numeric / NULLIF(COUNT(*), 0) * 100, 2)
        FROM interactions WHERE created_at >= NOW() - interval '30 days'
      ),
      'pending_followups', (SELECT COUNT(*) FROM interactions WHERE COALESCE(follow_up_date, data_followup::date) <= CURRENT_DATE AND COALESCE(followup_concluido, false) = false)
    ),
    'capabilities', jsonb_build_object(
      'tags', true, 'priorities', true, 'goals', true, 'templates', true,
      'reminders', true, 'proposals', true, 'campaigns', true, 'favorites', true,
      'notes', true, 'reports', true, 'whatsapp', true, 'audit_trail', true,
      'bulk_operations', true, 'performance_metrics', true, 'alerts', true,
      'import_export', true, 'recommendations', true, 'engagement_scoring', true,
      'documents', true, 'multi_channel', true, 'visits', true, 'workflow', true,
      'lgpd_compliance', true
    )
  );
END;
$function$
