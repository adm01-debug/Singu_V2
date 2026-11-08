CREATE OR REPLACE FUNCTION public.get_leads_ready_to_convert(p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, name text, maturity text, score integer, recommended_action text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm), calculate_lead_maturity(c.id), calculate_conversion_probability(c.id),
    CASE 
      WHEN calculate_lead_maturity(c.id) = 'Qualificado' THEN 'Apresentar proposta'
      WHEN calculate_lead_maturity(c.id) = 'Engajado' THEN 'Agendar reunião'
      WHEN calculate_lead_maturity(c.id) = 'Interessado' THEN 'Enviar material'
      ELSE 'Continuar nurturing'
    END
  FROM companies c WHERE c.deleted_at IS NULL AND c.is_customer = false
  ORDER BY calculate_conversion_probability(c.id) DESC LIMIT p_limit;
$function$
