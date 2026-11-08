CREATE OR REPLACE FUNCTION public.get_response_time_stats(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_avg_minutes numeric;
  v_median_minutes numeric;
  v_p90_minutes numeric;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  WITH response_times AS (
    SELECT 
      i2.data_interacao - i1.data_interacao as response_time
    FROM interactions i1
    JOIN interactions i2 ON i2.company_id = i1.company_id 
      AND i2.data_interacao > i1.data_interacao
      AND i2.direction = 'outbound'
      AND i1.direction = 'inbound'
    WHERE i1.data_interacao >= NOW() - (p_days || ' days')::interval
      AND (p_user_id IS NULL OR i2.user_id = p_user_id)
  )
  SELECT 
    ROUND(EXTRACT(EPOCH FROM AVG(response_time))/60, 2),
    ROUND(EXTRACT(EPOCH FROM PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time))/60, 2),
    ROUND(EXTRACT(EPOCH FROM PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY response_time))/60, 2)
  INTO v_avg_minutes, v_median_minutes, v_p90_minutes
  FROM response_times;

  v_result := jsonb_build_object(
    'period_days', p_days,
    'avg_response_minutes', COALESCE(v_avg_minutes, 0),
    'median_response_minutes', COALESCE(v_median_minutes, 0),
    'p90_response_minutes', COALESCE(v_p90_minutes, 0),
    'calculated_at', NOW()
  );
  
  RETURN v_result;
END;
$function$
