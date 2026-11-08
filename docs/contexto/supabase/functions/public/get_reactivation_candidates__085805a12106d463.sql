CREATE OR REPLACE FUNCTION public.get_reactivation_candidates(p_days integer DEFAULT 60, p_limit integer DEFAULT 100)
 RETURNS TABLE(company_id uuid, name text, days_inactive integer, revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm),
    EXTRACT(DAY FROM NOW() - (SELECT MAX(i.data_interacao) FROM interactions i WHERE i.company_id = c.id))::int,
    (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho')
  FROM companies c WHERE c.is_customer = true AND c.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - (p_days || ' days')::interval)
  ORDER BY 4 DESC LIMIT p_limit;
$function$
