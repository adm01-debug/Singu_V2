CREATE OR REPLACE FUNCTION public.get_weekly_summary(p_user_id uuid, p_week_start date DEFAULT (date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_interactions_by_day jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_object_agg(day_name, cnt) INTO v_interactions_by_day
  FROM (
    SELECT TO_CHAR(data_interacao, 'Day') as day_name, COUNT(*) as cnt
    FROM interactions
    WHERE user_id = p_user_id
      AND data_interacao >= p_week_start
      AND data_interacao < p_week_start + INTERVAL '7 days'
    GROUP BY TO_CHAR(data_interacao, 'Day')
  ) t;

  v_result := jsonb_build_object(
    'week_start', p_week_start,
    'user_id', p_user_id,
    'total_interactions', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND data_interacao >= p_week_start AND data_interacao < p_week_start + INTERVAL '7 days'),
    'companies_contacted', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE user_id = p_user_id AND data_interacao >= p_week_start AND data_interacao < p_week_start + INTERVAL '7 days'),
    'new_companies', (SELECT COUNT(*) FROM companies WHERE user_id = p_user_id AND created_at >= p_week_start AND created_at < p_week_start + INTERVAL '7 days'),
    'interactions_by_day', COALESCE(v_interactions_by_day, '{}'::jsonb),
    'calculated_at', NOW()
  );
  
  RETURN v_result;
END;
$function$
