CREATE OR REPLACE FUNCTION public.get_segment_companies_v2(p_segment_id uuid, p_limit integer DEFAULT 100)
 RETURNS TABLE(company_id uuid, nome_crm text, nome_fantasia text, status company_status, is_customer boolean, segment_score numeric, added_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome_crm,
    c.nome_fantasia,
    c.status,
    c.is_customer,
    sm.score,
    sm.added_at
  FROM segment_members sm
  JOIN companies c ON c.id = sm.company_id
  WHERE sm.segment_id = p_segment_id
  ORDER BY sm.score DESC, sm.added_at DESC
  LIMIT p_limit;
END;
$function$
