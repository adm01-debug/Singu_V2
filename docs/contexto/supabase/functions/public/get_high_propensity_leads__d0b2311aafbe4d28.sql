CREATE OR REPLACE FUNCTION public.get_high_propensity_leads(p_min_score integer DEFAULT 60)
 RETURNS TABLE(company_id uuid, name text, propensity_score integer, ramo text, has_open_deal boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm), calculate_propensity_score(c.id), c.ramo_atividade,
    EXISTS(SELECT 1 FROM deals d WHERE d.company_id = c.id AND d.status NOT IN ('ganho', 'perdido'))
  FROM companies c WHERE c.deleted_at IS NULL AND c.is_customer = false AND calculate_propensity_score(c.id) >= p_min_score
  ORDER BY 3 DESC LIMIT 50;
$function$
