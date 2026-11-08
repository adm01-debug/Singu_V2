CREATE OR REPLACE FUNCTION public.get_stale_companies(p_days integer DEFAULT 30, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, company_name text, user_name text, days_stale integer, last_activity timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    COALESCE(p.full_name, p.email, 'Sem responsável')::text,
    EXTRACT(DAY FROM NOW() - COALESCE(MAX(i.data_interacao), c.created_at))::int,
    COALESCE(MAX(i.data_interacao), c.created_at)
  FROM companies c
  LEFT JOIN profiles p ON p.id = c.user_id
  LEFT JOIN interactions i ON i.company_id = c.id
  WHERE c.deleted_at IS NULL
  GROUP BY c.id, c.nome_fantasia, c.nome_crm, p.full_name, p.email, c.created_at
  HAVING COALESCE(MAX(i.data_interacao), c.created_at) < NOW() - (p_days || ' days')::interval
  ORDER BY COALESCE(MAX(i.data_interacao), c.created_at)
  LIMIT p_limit;
END;
$function$
