CREATE OR REPLACE FUNCTION public.get_salesperson_performance(p_user_id uuid, p_period_start date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date, p_period_end date DEFAULT CURRENT_DATE)
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
    'period', jsonb_build_object('start', p_period_start, 'end', p_period_end),
    'interactions', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND created_at::date BETWEEN p_period_start AND p_period_end),
      'by_type', (
        SELECT COALESCE(jsonb_object_agg(type, cnt), '{}'::jsonb)
        FROM (
          SELECT type, COUNT(*) as cnt 
          FROM interactions 
          WHERE user_id = p_user_id AND created_at::date BETWEEN p_period_start AND p_period_end
          GROUP BY type
        ) t
      ),
      'daily_average', ROUND(
        (SELECT COUNT(*)::numeric FROM interactions WHERE user_id = p_user_id AND created_at::date BETWEEN p_period_start AND p_period_end) /
        GREATEST((p_period_end - p_period_start + 1), 1), 2
      )
    ),
    'companies', jsonb_build_object(
      'total_assigned', (SELECT COUNT(*) FROM companies WHERE user_id = p_user_id AND status = 'ativo'),
      'new_period', (SELECT COUNT(*) FROM companies WHERE user_id = p_user_id AND created_at::date BETWEEN p_period_start AND p_period_end),
      'contacted', (
        SELECT COUNT(DISTINCT company_id) 
        FROM interactions 
        WHERE user_id = p_user_id AND created_at::date BETWEEN p_period_start AND p_period_end
      )
    ),
    'response_time', jsonb_build_object(
      'avg_hours', (
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM (i2.created_at - i1.created_at)) / 3600)::numeric, 2)
        FROM interactions i1
        JOIN interactions i2 ON i2.company_id = i1.company_id AND i2.user_id = p_user_id AND i2.created_at > i1.created_at
        WHERE i1.metadata->>'direction' = 'inbound'
          AND i1.created_at::date BETWEEN p_period_start AND p_period_end
      )
    ),
    'productivity', jsonb_build_object(
      'working_days', (p_period_end - p_period_start + 1) - 
        (SELECT COUNT(*) FROM generate_series(p_period_start, p_period_end, '1 day'::interval) d WHERE EXTRACT(DOW FROM d) IN (0, 6)),
      'days_with_activity', (
        SELECT COUNT(DISTINCT created_at::date) 
        FROM interactions 
        WHERE user_id = p_user_id AND created_at::date BETWEEN p_period_start AND p_period_end
      )
    ),
    'generated_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
