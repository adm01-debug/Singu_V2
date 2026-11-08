CREATE OR REPLACE FUNCTION public.get_recent_companies(p_days integer DEFAULT 7, p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, trade_name text, segment text, source text, salesperson text, created_at timestamp with time zone, has_contact boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    c.id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as trade_name,
    c.ramo_atividade as segment,
    c.source,
    p.full_name as salesperson,
    c.created_at,
    EXISTS(SELECT 1 FROM contacts ct WHERE ct.company_id = c.id) as has_contact
  FROM companies c
  LEFT JOIN profiles p ON p.id = c.user_id
  WHERE c.created_at >= NOW() - (p_days || ' days')::interval
    AND (p_user_id IS NULL OR c.user_id = p_user_id)
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$function$
