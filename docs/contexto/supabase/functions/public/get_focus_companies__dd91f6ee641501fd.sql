CREATE OR REPLACE FUNCTION public.get_focus_companies(p_user_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(company_id uuid, name text, reason text, score integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm),
    CASE 
      WHEN EXISTS (SELECT 1 FROM deals d WHERE d.company_id = c.id AND d.status NOT IN ('ganho', 'perdido') AND d.valor >= 10000) THEN 'Deal alto valor em aberto'
      WHEN c.is_customer = true AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '30 days') THEN 'Cliente inativo'
      WHEN calculate_conversion_probability(c.id) >= 70 THEN 'Alta probabilidade de conversão'
      ELSE 'Oportunidade de negócio'
    END,
    calculate_conversion_probability(c.id)
  FROM companies c WHERE c.user_id = p_user_id AND c.deleted_at IS NULL
  ORDER BY calculate_conversion_probability(c.id) DESC LIMIT p_limit;
$function$
