CREATE OR REPLACE FUNCTION public.get_top_companies_by_interactions(p_limit integer DEFAULT 10, p_days integer DEFAULT 30)
 RETURNS TABLE(ranking bigint, company_id uuid, nome_crm text, total_interacoes bigint, ultima_interacao timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY COUNT(i.id) DESC) as ranking,
    c.id as company_id,
    c.nome_crm,
    COUNT(i.id) as total_interacoes,
    MAX(i.created_at) as ultima_interacao
  FROM companies c
  JOIN interactions i ON i.company_id = c.id
  WHERE c.deleted_at IS NULL
  AND i.created_at >= now() - (p_days || ' days')::interval
  GROUP BY c.id, c.nome_crm
  ORDER BY COUNT(i.id) DESC
  LIMIT p_limit;
END;
$function$
