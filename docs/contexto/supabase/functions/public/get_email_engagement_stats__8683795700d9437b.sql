CREATE OR REPLACE FUNCTION public.get_email_engagement_stats(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_total_sent int;
  v_total_opened int;
  v_total_clicked int;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE metadata->>'email_opened_at' IS NOT NULL),
    COUNT(*) FILTER (WHERE metadata->>'email_clicked_at' IS NOT NULL)
  INTO v_total_sent, v_total_opened, v_total_clicked
  FROM interactions
  WHERE type = 'email' AND direction = 'outbound'
    AND data_interacao >= NOW() - (p_days || ' days')::interval
    AND (p_user_id IS NULL OR user_id = p_user_id);

  v_result := jsonb_build_object(
    'period_days', p_days,
    'total_sent', v_total_sent,
    'total_opened', v_total_opened,
    'total_clicked', v_total_clicked,
    'open_rate', CASE WHEN v_total_sent > 0 THEN ROUND((v_total_opened::numeric/v_total_sent)*100, 2) ELSE 0 END,
    'click_rate', CASE WHEN v_total_opened > 0 THEN ROUND((v_total_clicked::numeric/v_total_opened)*100, 2) ELSE 0 END,
    'calculated_at', NOW()
  );
  
  RETURN v_result;
END;
$function$
