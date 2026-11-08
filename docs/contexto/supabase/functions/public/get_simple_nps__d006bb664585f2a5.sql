CREATE OR REPLACE FUNCTION public.get_simple_nps(p_days integer DEFAULT 90, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total int;
  v_positive int;
  v_neutral int;
  v_negative int;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE sentiment = 'positive'),
    COUNT(*) FILTER (WHERE sentiment = 'neutral'),
    COUNT(*) FILTER (WHERE sentiment = 'negative')
  INTO v_total, v_positive, v_neutral, v_negative
  FROM interactions
  WHERE type = 'feedback'
    AND data_interacao >= NOW() - (p_days || ' days')::interval
    AND (p_user_id IS NULL OR user_id = p_user_id);
  
  RETURN jsonb_build_object(
    'total_feedbacks', v_total,
    'promoters', v_positive,
    'neutrals', v_neutral,
    'detractors', v_negative,
    'nps_score', CASE 
      WHEN v_total > 0 THEN 
        ROUND(((v_positive::numeric - v_negative::numeric) / v_total::numeric) * 100)
      ELSE 0
    END,
    'period_days', p_days
  );
END;
$function$
