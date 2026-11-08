CREATE OR REPLACE FUNCTION public.get_automation_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_rules', (SELECT COUNT(*) FROM automation_rules),
    'active_rules', (SELECT COUNT(*) FROM automation_rules WHERE is_active = true),
    'executions_today', (SELECT COUNT(*) FROM automation_executions WHERE created_at >= CURRENT_DATE),
    'executions_week', (SELECT COUNT(*) FROM automation_executions WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'failed_today', (SELECT COUNT(*) FROM automation_executions WHERE status = 'failed' AND created_at >= CURRENT_DATE),
    'top_rules', (
      SELECT COALESCE(jsonb_agg(r ORDER BY r.execution_count DESC), '[]')
      FROM (
        SELECT name, COALESCE(execution_count, 0) as execution_count, last_executed_at
        FROM automation_rules
        WHERE is_active = true
        LIMIT 5
      ) r
    ),
    'by_trigger_type', (
      SELECT COALESCE(jsonb_agg(t), '[]')
      FROM (
        SELECT trigger_type, COUNT(*) as count
        FROM automation_rules
        WHERE is_active = true
        GROUP BY trigger_type
      ) t
    )
  );
END;
$function$
