CREATE OR REPLACE FUNCTION public.get_unassigned_companies(p_limit integer DEFAULT 100)
 RETURNS TABLE(company_id uuid, company_name text, state text, city text, created_at timestamp with time zone, total_interactions bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome_fantasia::TEXT,
    ca.uf,
    ca.cidade,
    c.created_at,
    (SELECT COUNT(*) FROM interactions WHERE company_id = c.id)
  FROM companies c
  LEFT JOIN company_addresses ca ON ca.company_id = c.id AND ca.type = 'principal'
  WHERE c.user_id IS NULL
    AND c.deleted_at IS NULL
    AND c.status = 'ativo'
  ORDER BY (SELECT COUNT(*) FROM interactions WHERE company_id = c.id) DESC, c.created_at
  LIMIT p_limit;
END;
$function$
