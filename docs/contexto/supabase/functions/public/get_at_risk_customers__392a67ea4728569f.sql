CREATE OR REPLACE FUNCTION public.get_at_risk_customers(p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, health_score integer, engagement_level text, days_since_interaction integer, risk_factors jsonb, recommended_actions jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    chs.company_id,
    c.nome_crm,
    chs.health_score,
    chs.engagement_level,
    EXTRACT(DAY FROM NOW() - (SELECT MAX(data_interacao) FROM interactions WHERE interactions.company_id = c.id))::integer,
    chs.risk_factors,
    chs.recommended_actions
  FROM customer_health_scores chs
  JOIN companies c ON c.id = chs.company_id
  WHERE chs.score_date = CURRENT_DATE
    AND chs.engagement_level = 'at_risk'
    AND c.is_customer = true
    AND c.deleted_at IS NULL
  ORDER BY chs.health_score
  LIMIT p_limit;
END;
$function$
