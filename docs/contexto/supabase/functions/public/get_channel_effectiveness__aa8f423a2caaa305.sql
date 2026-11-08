CREATE OR REPLACE FUNCTION public.get_channel_effectiveness(p_days integer DEFAULT 90)
 RETURNS TABLE(channel text, total_interactions bigint, avg_response_time_min numeric, positive_sentiment_pct numeric, followup_completion_pct numeric, companies_reached bigint, effectiveness_score numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.channel,
    COUNT(*),
    ROUND(AVG(i.response_time)::NUMERIC / 60, 2),
    ROUND(100.0 * COUNT(*) FILTER (WHERE i.sentiment = 'positivo') / NULLIF(COUNT(*), 0), 1),
    ROUND(100.0 * COUNT(*) FILTER (WHERE i.follow_up_required AND i.followup_concluido) / NULLIF(COUNT(*) FILTER (WHERE i.follow_up_required), 0), 1),
    COUNT(DISTINCT i.company_id),
    -- Score composto: 40% volume, 30% sentimento, 30% resolução
    ROUND(
      0.4 * (COUNT(*)::NUMERIC / NULLIF((SELECT MAX(cnt) FROM (SELECT COUNT(*) as cnt FROM interactions WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL GROUP BY channel) sub), 0) * 100) +
      0.3 * COALESCE(100.0 * COUNT(*) FILTER (WHERE i.sentiment = 'positivo') / NULLIF(COUNT(*), 0), 0) +
      0.3 * COALESCE(100.0 * COUNT(*) FILTER (WHERE i.follow_up_required AND i.followup_concluido) / NULLIF(COUNT(*) FILTER (WHERE i.follow_up_required), 0), 0)
    , 1)
  FROM interactions i
  WHERE i.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY i.channel
  ORDER BY COUNT(*) DESC;
END;
$function$
