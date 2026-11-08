CREATE OR REPLACE FUNCTION public.get_hot_leads(p_days integer DEFAULT 7, p_min_interactions integer DEFAULT 3, p_limit integer DEFAULT 20)
 RETURNS TABLE(company_id uuid, company_name text, interaction_count bigint, last_interaction timestamp with time zone, types_used text[], score numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    COUNT(i.id)::bigint as interaction_count,
    MAX(i.data_interacao) as last_interaction,
    ARRAY_AGG(DISTINCT i.type)::text[] as types_used,
    (COUNT(i.id) * 10 + 
     CASE WHEN MAX(i.data_interacao) >= NOW() - INTERVAL '1 day' THEN 30 
          WHEN MAX(i.data_interacao) >= NOW() - INTERVAL '3 days' THEN 20 
          ELSE 10 END +
     ARRAY_LENGTH(ARRAY_AGG(DISTINCT i.type), 1) * 5)::numeric as score
  FROM companies c
  JOIN interactions i ON i.company_id = c.id
  WHERE c.deleted_at IS NULL
    AND i.data_interacao >= NOW() - (p_days || ' days')::interval
  GROUP BY c.id, c.nome_fantasia, c.nome_crm, c.razao_social
  HAVING COUNT(i.id) >= p_min_interactions
  ORDER BY score DESC
  LIMIT p_limit;
END;
$function$
