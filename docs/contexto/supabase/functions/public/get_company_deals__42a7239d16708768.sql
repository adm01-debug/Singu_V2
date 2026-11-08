CREATE OR REPLACE FUNCTION public.get_company_deals(p_company_id uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(deal_id uuid, titulo text, valor numeric, status text, pipeline_stage text, created_at timestamp with time zone, user_name text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as deal_id,
    d.titulo::text,
    d.valor,
    d.status::text,
    d.pipeline_stage::text,
    d.created_at,
    pr.full_name::text as user_name
  FROM deals d
  LEFT JOIN profiles pr ON pr.id = d.user_id
  WHERE d.company_id = p_company_id
  ORDER BY d.created_at DESC
  LIMIT p_limit;
END;
$function$
