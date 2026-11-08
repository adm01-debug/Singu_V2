CREATE OR REPLACE FUNCTION public.get_sentiment_trend(p_company_id uuid, p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'total_interactions', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id AND data_interacao >= NOW() - (p_days || ' days')::interval),
    'positive', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id AND sentiment = 'positive' AND data_interacao >= NOW() - (p_days || ' days')::interval),
    'neutral', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id AND sentiment = 'neutral' AND data_interacao >= NOW() - (p_days || ' days')::interval),
    'negative', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id AND sentiment = 'negative' AND data_interacao >= NOW() - (p_days || ' days')::interval),
    'avg_score', (SELECT ROUND(AVG(sentiment_score), 2) FROM interactions WHERE company_id = p_company_id AND sentiment_score IS NOT NULL)
  );
END;
$function$
