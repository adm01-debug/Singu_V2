CREATE OR REPLACE FUNCTION public.analyze_churn_risk()
 RETURNS TABLE(company_id uuid, company_name text, risk_level text, risk_score integer, days_inactive integer, last_interaction date, recommended_action text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm)::text as company_name,
    CASE 
      WHEN stats.v_days_inactive > 90 THEN 'critical'
      WHEN stats.v_days_inactive > 60 THEN 'high'
      WHEN stats.v_days_inactive > 30 THEN 'medium'
      ELSE 'low'
    END::text as risk_level,
    CASE 
      WHEN stats.v_days_inactive > 90 THEN 100
      WHEN stats.v_days_inactive > 60 THEN 75
      WHEN stats.v_days_inactive > 30 THEN 50
      ELSE 25
    END as risk_score,
    stats.v_days_inactive as days_inactive,
    stats.v_last_interaction as last_interaction,
    CASE 
      WHEN stats.v_days_inactive > 90 THEN 'Contato urgente - risco de perda'
      WHEN stats.v_days_inactive > 60 THEN 'Ligar para reativar relacionamento'
      WHEN stats.v_days_inactive > 30 THEN 'Enviar email de nutrição'
      ELSE 'Manter contato regular'
    END::text as recommended_action
  FROM companies c
  CROSS JOIN LATERAL (
    SELECT 
      COALESCE((CURRENT_DATE - MAX(i.data_interacao)::date), 999) as v_days_inactive,
      MAX(i.data_interacao)::date as v_last_interaction
    FROM interactions i WHERE i.company_id = c.id
  ) stats
  WHERE c.deleted_at IS NULL 
    AND c.status = 'ativo'
    AND c.is_customer = true
  ORDER BY stats.v_days_inactive DESC
  LIMIT 100;
END;
$function$
