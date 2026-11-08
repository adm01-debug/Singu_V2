CREATE OR REPLACE FUNCTION public.get_manager_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'team_size', (SELECT COUNT(*) FROM profiles WHERE is_active = true),
    'month_revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())),
    'month_target', (SELECT COALESCE(SUM(target_value), 0) FROM user_goals WHERE goal_type = 'deals_value' AND period_end >= CURRENT_DATE),
    'pipeline_total', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido')),
    'open_deals', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido')),
    'win_rate', (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) FROM deals WHERE closed_at >= DATE_TRUNC('month', NOW())),
    'top_performers', (
      SELECT jsonb_agg(jsonb_build_object('name', user_name, 'revenue', revenue))
      FROM (SELECT COALESCE(p.full_name, p.email) as user_name, COALESCE(SUM(d.valor), 0) as revenue
        FROM profiles p LEFT JOIN deals d ON d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= DATE_TRUNC('month', NOW())
        WHERE p.is_active = true GROUP BY p.id, p.full_name, p.email ORDER BY revenue DESC LIMIT 5) sub
    ),
    'alerts', jsonb_build_object(
      'stalled_deals', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - interval '7 days'),
      'low_activity_users', (SELECT COUNT(*) FROM profiles p WHERE p.is_active = true AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.user_id = p.id AND i.data_interacao >= NOW() - interval '3 days'))
    ),
    'generated_at', NOW()
  ) INTO v_result;
  RETURN v_result;
END;
$function$
