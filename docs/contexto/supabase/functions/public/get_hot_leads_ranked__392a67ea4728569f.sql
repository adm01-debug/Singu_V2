CREATE OR REPLACE FUNCTION public.get_hot_leads_ranked(p_limit integer DEFAULT 20)
 RETURNS TABLE(company_id uuid, company_name text, lead_score integer, engagement_score integer, last_interaction date, recommendation text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    COALESCE(c.lead_score, 0),
    COALESCE((SELECT COUNT(*)::int FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= CURRENT_DATE - 30), 0),
    (SELECT MAX(i.data_interacao)::date FROM interactions i WHERE i.company_id = c.id),
    CASE 
      WHEN c.lead_score >= 80 THEN 'Contato prioritário'
      WHEN c.lead_score >= 60 THEN 'Agendar reunião'
      WHEN c.lead_score >= 40 THEN 'Enviar proposta'
      ELSE 'Nutrir com conteúdo'
    END::text
  FROM companies c
  WHERE c.deleted_at IS NULL
    AND c.status = 'ativo'
    AND c.is_customer = false
    AND COALESCE(c.lead_score, 0) >= 30
  ORDER BY c.lead_score DESC NULLS LAST, 
    (SELECT MAX(data_interacao) FROM interactions WHERE company_id = c.id) DESC NULLS LAST
  LIMIT p_limit;
END;
$function$
