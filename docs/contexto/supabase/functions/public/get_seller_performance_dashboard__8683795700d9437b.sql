CREATE OR REPLACE FUNCTION public.get_seller_performance_dashboard(p_user_id uuid, p_days integer DEFAULT 30)
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
    'user_id', p_user_id,
    'period_days', p_days,
    'totals', (
      SELECT jsonb_build_object(
        'interactions', SUM(interactions_count),
        'calls', SUM(calls_count),
        'emails', SUM(emails_count),
        'whatsapp', SUM(whatsapp_count),
        'meetings', SUM(meetings_count),
        'deals_won', SUM(deals_won),
        'deals_lost', SUM(deals_lost),
        'revenue', SUM(revenue_generated),
        'new_companies', SUM(new_companies)
      )
      FROM seller_daily_metrics
      WHERE user_id = p_user_id
        AND metric_date >= CURRENT_DATE - p_days
    ),
    'daily_avg', (
      SELECT jsonb_build_object(
        'interactions', ROUND(AVG(interactions_count)::numeric, 1),
        'calls', ROUND(AVG(calls_count)::numeric, 1),
        'revenue', ROUND(AVG(revenue_generated)::numeric, 2)
      )
      FROM seller_daily_metrics
      WHERE user_id = p_user_id
        AND metric_date >= CURRENT_DATE - p_days
    ),
    'win_rate', (
      SELECT ROUND(
        CASE WHEN SUM(deals_won) + SUM(deals_lost) > 0
          THEN (SUM(deals_won)::numeric / (SUM(deals_won) + SUM(deals_lost)) * 100)
          ELSE 0
        END, 1
      )
      FROM seller_daily_metrics
      WHERE user_id = p_user_id
        AND metric_date >= CURRENT_DATE - p_days
    ),
    'trend', (
      SELECT COALESCE(jsonb_agg(d ORDER BY d.metric_date), '[]')
      FROM (
        SELECT metric_date, interactions_count, revenue_generated
        FROM seller_daily_metrics
        WHERE user_id = p_user_id
          AND metric_date >= CURRENT_DATE - p_days
        ORDER BY metric_date
      ) d
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
