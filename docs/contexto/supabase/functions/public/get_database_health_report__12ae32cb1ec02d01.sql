CREATE OR REPLACE FUNCTION public.get_database_health_report()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'summary', jsonb_build_object(
      'total_tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
      'total_functions', (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f'),
      'total_triggers', (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public'),
      'total_indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
      'total_policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
      'database_size', pg_size_pretty(pg_database_size(current_database()))
    ),
    'data_quality', jsonb_build_object(
      'companies_total', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'companies_without_cnpj', (SELECT COUNT(*) FROM companies WHERE cnpj IS NULL AND deleted_at IS NULL),
      'contacts_total', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'contacts_orphan', (SELECT COUNT(*) FROM contacts WHERE company_id IS NULL AND deleted_at IS NULL),
      'interactions_total', (SELECT COUNT(*) FROM interactions),
      'deals_total', (SELECT COUNT(*) FROM deals),
      'proposals_total', (SELECT COUNT(*) FROM proposals)
    ),
    'activity', jsonb_build_object(
      'interactions_today', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= CURRENT_DATE),
      'interactions_week', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= CURRENT_DATE - 7),
      'interactions_month', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= DATE_TRUNC('month', CURRENT_DATE)),
      'deals_month', (SELECT COUNT(*) FROM deals WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
      'revenue_month', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE))
    ),
    'alerts', jsonb_build_object(
      'overdue_followups', (SELECT COUNT(*) FROM interactions WHERE follow_up_date < CURRENT_DATE AND COALESCE(followup_concluido, false) = false),
      'overdue_tasks', (SELECT COUNT(*) FROM tasks WHERE due_date < CURRENT_DATE AND status = 'pending'),
      'stale_deals', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - INTERVAL '14 days'),
      'unread_notifications', (SELECT COUNT(*) FROM notifications WHERE is_read = false)
    ),
    'tables_without_rls', (
      SELECT jsonb_agg(c.relname)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false
      AND c.relname NOT LIKE '%_backup%' AND c.relname NOT LIKE 'pg_%'
    ),
    'generated_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
