CREATE OR REPLACE FUNCTION public.get_churn_risk_companies(p_days_threshold integer DEFAULT 60, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, company_name text, days_since_interaction integer, total_interactions bigint, last_interaction_date timestamp with time zone, risk_level text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    COALESCE(EXTRACT(DAY FROM NOW() - MAX(i.data_interacao))::int, 999) as days_since_interaction,
    COUNT(i.id)::bigint as total_interactions,
    MAX(i.data_interacao) as last_interaction_date,
    CASE 
      WHEN COALESCE(EXTRACT(DAY FROM NOW() - MAX(i.data_interacao))::int, 999) > 180 THEN 'critical'
      WHEN COALESCE(EXTRACT(DAY FROM NOW() - MAX(i.data_interacao))::int, 999) > 90 THEN 'high'
      WHEN COALESCE(EXTRACT(DAY FROM NOW() - MAX(i.data_interacao))::int, 999) > 60 THEN 'medium'
      ELSE 'low'
    END::text as risk_level
  FROM companies c
  LEFT JOIN interactions i ON i.company_id = c.id
  WHERE c.deleted_at IS NULL
    AND c.is_customer = true
  GROUP BY c.id, c.nome_fantasia, c.nome_crm, c.razao_social
  HAVING COALESCE(EXTRACT(DAY FROM NOW() - MAX(i.data_interacao))::int, 999) >= p_days_threshold
  ORDER BY days_since_interaction DESC
  LIMIT p_limit;
END;
$function$
