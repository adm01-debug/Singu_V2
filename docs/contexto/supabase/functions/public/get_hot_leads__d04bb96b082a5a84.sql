CREATE OR REPLACE FUNCTION public.get_hot_leads(p_min_score integer DEFAULT 50, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, name text, score integer, last_interaction timestamp with time zone, has_deal boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm), calculate_conversion_probability(c.id),
    (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id),
    EXISTS(SELECT 1 FROM deals d WHERE d.company_id = c.id AND d.status NOT IN ('ganho', 'perdido'))
  FROM companies c WHERE c.deleted_at IS NULL AND c.is_customer = false AND calculate_conversion_probability(c.id) >= p_min_score
  ORDER BY 3 DESC LIMIT p_limit;
$function$
