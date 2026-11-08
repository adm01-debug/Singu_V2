CREATE OR REPLACE FUNCTION public.get_message_sentiment_trend(p_company_id uuid DEFAULT NULL::uuid, p_months integer DEFAULT 6)
 RETURNS TABLE(month text, total_messages bigint, positive_count bigint, negative_count bigint, neutral_count bigint, positive_pct numeric, negative_pct numeric, sentiment_score numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', i.created_at), 'YYYY-MM'),
    COUNT(*),
    COUNT(*) FILTER (WHERE i.sentiment = 'positivo'),
    COUNT(*) FILTER (WHERE i.sentiment = 'negativo'),
    COUNT(*) FILTER (WHERE i.sentiment = 'neutro' OR i.sentiment IS NULL),
    ROUND(100.0 * COUNT(*) FILTER (WHERE i.sentiment = 'positivo') / NULLIF(COUNT(*), 0), 1),
    ROUND(100.0 * COUNT(*) FILTER (WHERE i.sentiment = 'negativo') / NULLIF(COUNT(*), 0), 1),
    ROUND((
      COUNT(*) FILTER (WHERE i.sentiment = 'positivo') * 1.0 
      - COUNT(*) FILTER (WHERE i.sentiment = 'negativo') * 1.0
    ) / NULLIF(COUNT(*), 0)::NUMERIC, 3)
  FROM interactions i
  WHERE i.created_at >= NOW() - (p_months || ' months')::INTERVAL
    AND (p_company_id IS NULL OR i.company_id = p_company_id)
  GROUP BY DATE_TRUNC('month', i.created_at)
  ORDER BY DATE_TRUNC('month', i.created_at);
END;
$function$
