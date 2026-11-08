CREATE OR REPLACE FUNCTION public.get_companies_by_behavior(p_behavior text, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, name text, last_interaction timestamp with time zone, total_revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm),
    (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id),
    (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho')
  FROM companies c
  WHERE c.deleted_at IS NULL AND (
    (p_behavior = 'vip' AND c.is_customer = true AND EXISTS (SELECT 1 FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho' AND d.valor > 10000)) OR
    (p_behavior = 'ativo' AND c.is_customer = true) OR
    (p_behavior = 'negociando' AND EXISTS (SELECT 1 FROM deals d WHERE d.company_id = c.id AND d.status NOT IN ('ganho', 'perdido'))) OR
    (p_behavior = 'inativo' AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '60 days')) OR
    (p_behavior = 'novo' AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id))
  )
  LIMIT p_limit;
$function$
