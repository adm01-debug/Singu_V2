CREATE OR REPLACE FUNCTION public.get_nps_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'current_nps', (SELECT * FROM calculate_nps(30)),
    'nps_90d', (SELECT * FROM calculate_nps(90)),
    'nps_trend', (
      SELECT COALESCE(jsonb_agg(t ORDER BY t.month), '[]')
      FROM (SELECT * FROM get_nps_trend(6)) t
    ),
    'recent_feedback', (
      SELECT COALESCE(jsonb_agg(f ORDER BY f.responded_at DESC), '[]')
      FROM (
        SELECT score, feedback, responded_at, category
        FROM customer_surveys
        WHERE survey_type = 'nps' AND feedback IS NOT NULL
        ORDER BY responded_at DESC
        LIMIT 10
      ) f
    ),
    'action_needed', (
      SELECT COUNT(*)
      FROM customer_surveys
      WHERE survey_type = 'nps'
        AND category = 'detractor'
        AND responded_at >= CURRENT_DATE - 7
    )
  );
END;
$function$
