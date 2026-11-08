CREATE OR REPLACE FUNCTION public.search_companies_by_segment(p_segment text, p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, trade_name text, cnpj text, segment text, status text, salesperson text, interactions_count bigint, last_interaction timestamp with time zone)
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
    c.cnpj,
    c.ramo_atividade as segment,
    c.status::text,
    p.full_name as salesperson,
    (SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id) as interactions_count,
    (SELECT MAX(data_interacao) FROM interactions i WHERE i.company_id = c.id) as last_interaction
  FROM companies c
  LEFT JOIN profiles p ON p.id = c.user_id
  WHERE c.ramo_atividade ILIKE '%' || p_segment || '%'
    AND (p_user_id IS NULL OR c.user_id = p_user_id)
    AND c.status = 'ativo'
  ORDER BY COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)
  LIMIT p_limit;
END;
$function$
