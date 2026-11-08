CREATE OR REPLACE FUNCTION public.generate_sales_report(p_start_date date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date, p_end_date date DEFAULT CURRENT_DATE, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'period', jsonb_build_object('start', p_start_date, 'end', p_end_date),
    'summary', jsonb_build_object(
      'total_deals', COUNT(*),
      'won_deals', COUNT(*) FILTER (WHERE status = 'ganho'),
      'lost_deals', COUNT(*) FILTER (WHERE status = 'perdido'),
      'active_deals', COUNT(*) FILTER (WHERE status NOT IN ('ganho', 'perdido')),
      'total_revenue', COALESCE(SUM(valor) FILTER (WHERE status = 'ganho'), 0),
      'pipeline_value', COALESCE(SUM(valor) FILTER (WHERE status NOT IN ('ganho', 'perdido')), 0),
      'avg_deal_value', ROUND(AVG(valor) FILTER (WHERE status = 'ganho'), 2),
      'win_rate', ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1)
    ),
    'by_stage', (
      SELECT jsonb_agg(jsonb_build_object('stage', stage, 'count', cnt, 'value', val))
      FROM (
        SELECT stage, COUNT(*) as cnt, COALESCE(SUM(valor), 0) as val
        FROM deals
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
          AND created_at::date BETWEEN p_start_date AND p_end_date
        GROUP BY stage
      ) s
    ),
    'top_sellers', (
      SELECT jsonb_agg(jsonb_build_object('user_id', user_id, 'name', full_name, 'revenue', revenue, 'deals', deals))
      FROM (
        SELECT d.user_id, p.full_name, SUM(d.valor) as revenue, COUNT(*) as deals
        FROM deals d
        JOIN profiles p ON p.id = d.user_id
        WHERE d.status = 'ganho' AND d.closed_at::date BETWEEN p_start_date AND p_end_date
        GROUP BY d.user_id, p.full_name
        ORDER BY revenue DESC
        LIMIT 5
      ) t
    ),
    'generated_at', NOW()
  ) INTO v_result
  FROM deals
  WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND created_at::date BETWEEN p_start_date AND p_end_date;
  
  RETURN v_result;
END;
$function$
