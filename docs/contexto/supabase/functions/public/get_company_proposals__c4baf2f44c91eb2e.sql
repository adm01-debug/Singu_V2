CREATE OR REPLACE FUNCTION public.get_company_proposals(p_company_id uuid, p_status text DEFAULT NULL::text)
 RETURNS TABLE(proposal_id uuid, titulo text, valor_total numeric, status text, created_at timestamp with time zone, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.titulo::text,
    COALESCE(pr.valor_total, 0),
    pr.status::text,
    pr.created_at,
    pr.expires_at
  FROM proposals pr
  WHERE pr.company_id = p_company_id
    AND (p_status IS NULL OR pr.status = p_status)
  ORDER BY pr.created_at DESC;
END;
$function$
