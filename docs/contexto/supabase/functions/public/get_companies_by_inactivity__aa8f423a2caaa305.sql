CREATE OR REPLACE FUNCTION public.get_companies_by_inactivity(p_days integer DEFAULT 30)
 RETURNS TABLE(company_id uuid, company_name text, days_inactive integer, last_interaction timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    EXTRACT(DAY FROM NOW() - MAX(i.data_interacao))::int,
    MAX(i.data_interacao)
  FROM companies c
  LEFT JOIN interactions i ON i.company_id = c.id
  WHERE c.deleted_at IS NULL AND c.status = 'ativo'
  GROUP BY c.id, c.nome_fantasia, c.nome_crm
  HAVING MAX(i.data_interacao) < NOW() - (p_days || ' days')::interval
     OR MAX(i.data_interacao) IS NULL
  ORDER BY MAX(i.data_interacao) NULLS FIRST
  LIMIT 100;
END;
$function$
