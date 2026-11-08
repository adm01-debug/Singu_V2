CREATE OR REPLACE FUNCTION public.calculate_nps(p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_promoters integer;
  v_passives integer;
  v_detractors integer;
  v_total integer;
  v_nps numeric;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE category = 'promoter'),
    COUNT(*) FILTER (WHERE category = 'passive'),
    COUNT(*) FILTER (WHERE category = 'detractor'),
    COUNT(*)
  INTO v_promoters, v_passives, v_detractors, v_total
  FROM customer_surveys
  WHERE survey_type = 'nps'
    AND responded_at >= CURRENT_DATE - p_days;
  
  v_nps := CASE 
    WHEN v_total > 0 
    THEN ROUND(((v_promoters::numeric - v_detractors::numeric) / v_total * 100), 1)
    ELSE 0
  END;
  
  RETURN jsonb_build_object(
    'nps_score', v_nps,
    'promoters', v_promoters,
    'passives', v_passives,
    'detractors', v_detractors,
    'total_responses', v_total,
    'promoter_pct', CASE WHEN v_total > 0 THEN ROUND((v_promoters::numeric / v_total * 100), 1) ELSE 0 END,
    'detractor_pct', CASE WHEN v_total > 0 THEN ROUND((v_detractors::numeric / v_total * 100), 1) ELSE 0 END,
    'period_days', p_days
  );
END;
$function$
