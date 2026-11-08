CREATE OR REPLACE FUNCTION public.get_communication_summary(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'total_interactions', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
    'first_contact', (SELECT MIN(created_at) FROM interactions WHERE company_id = p_company_id),
    'last_contact', (SELECT MAX(created_at) FROM interactions WHERE company_id = p_company_id),
    'channels_used', (
      SELECT jsonb_object_agg(channel, cnt)
      FROM (
        SELECT channel, COUNT(*) as cnt
        FROM interactions WHERE company_id = p_company_id
        GROUP BY channel
      ) sub
    ),
    'direction_split', (
      SELECT jsonb_object_agg(direction, cnt)
      FROM (
        SELECT direction, COUNT(*) as cnt
        FROM interactions WHERE company_id = p_company_id
        GROUP BY direction
      ) sub
    ),
    'sentiment_split', (
      SELECT jsonb_object_agg(COALESCE(sentiment, 'nao_classificado'), cnt)
      FROM (
        SELECT sentiment, COUNT(*) as cnt
        FROM interactions WHERE company_id = p_company_id
        GROUP BY sentiment
      ) sub
    ),
    'avg_response_time_minutes', (
      SELECT ROUND(AVG(response_time)::NUMERIC / 60, 2)
      FROM interactions WHERE company_id = p_company_id AND response_time IS NOT NULL
    ),
    'contacts_involved', (
      SELECT COUNT(DISTINCT contact_id) FROM interactions WHERE company_id = p_company_id
    ),
    'monthly_trend', (
      SELECT jsonb_agg(jsonb_build_object('month', month, 'count', cnt))
      FROM (
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month, COUNT(*) as cnt
        FROM interactions WHERE company_id = p_company_id
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) DESC
        LIMIT 12
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
