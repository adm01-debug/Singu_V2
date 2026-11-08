CREATE OR REPLACE FUNCTION public.get_automations_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'total_automations', COUNT(*),
      'active', COUNT(*) FILTER (WHERE is_active = true),
      'total_runs', SUM(run_count),
      'runs_today', (SELECT COUNT(*) FROM automation_logs WHERE executed_at >= CURRENT_DATE),
      'success_rate', (SELECT ROUND(COUNT(*) FILTER (WHERE success = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) FROM automation_logs WHERE executed_at >= NOW() - INTERVAL '7 days')
    )
    FROM automations
  );
END;
$function$
