CREATE OR REPLACE FUNCTION public.get_weekly_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'week_start', DATE_TRUNC('week', NOW())::date,
    'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('week', NOW())),
    'deals_won', (SELECT COUNT(*) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('week', NOW())),
    'deals_lost', (SELECT COUNT(*) FROM deals WHERE status = 'perdido' AND closed_at >= DATE_TRUNC('week', NOW())),
    'interactions', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= DATE_TRUNC('week', NOW())),
    'new_leads', (SELECT COUNT(*) FROM companies WHERE created_at >= DATE_TRUNC('week', NOW()) AND deleted_at IS NULL),
    'conversion_rate', (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) FROM deals WHERE closed_at >= DATE_TRUNC('week', NOW()))
  );
END;
$function$
