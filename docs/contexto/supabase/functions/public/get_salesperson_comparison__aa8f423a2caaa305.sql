CREATE OR REPLACE FUNCTION public.get_salesperson_comparison(p_days integer DEFAULT 30)
 RETURNS TABLE(user_id uuid, user_name text, total_interactions bigint, companies_contacted bigint, avg_response_time_min numeric, positive_sentiment_pct numeric, followups_completed bigint, rank_overall integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      i.user_id as uid,
      COUNT(*) as interactions,
      COUNT(DISTINCT i.company_id) as companies,
      ROUND(AVG(i.response_time)::NUMERIC / 60, 2) as avg_rt,
      ROUND(100.0 * COUNT(*) FILTER (WHERE i.sentiment = 'positivo') / NULLIF(COUNT(*), 0), 1) as pos_pct,
      COUNT(*) FILTER (WHERE i.follow_up_required AND i.followup_concluido) as followups
    FROM interactions i
    WHERE i.created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND i.user_id IS NOT NULL
    GROUP BY i.user_id
  )
  SELECT 
    s.uid,
    p.full_name,
    s.interactions,
    s.companies,
    s.avg_rt,
    s.pos_pct,
    s.followups,
    ROW_NUMBER() OVER (ORDER BY s.interactions DESC)::INT
  FROM stats s
  LEFT JOIN profiles p ON p.id = s.uid
  ORDER BY s.interactions DESC;
END;
$function$
