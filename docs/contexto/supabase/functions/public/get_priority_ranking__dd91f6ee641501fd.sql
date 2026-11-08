CREATE OR REPLACE FUNCTION public.get_priority_ranking(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(company_id uuid, trade_name text, priority_score numeric, priority_level text, days_inactive integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  WITH scored AS (
    SELECT 
      c.id,
      COALESCE(c.nome_fantasia, c.nome_crm) as trade_name,
      calculate_priority_score(c.id) as score_data
    FROM companies c
    WHERE c.status = 'ativo'
      AND (p_user_id IS NULL OR c.user_id = p_user_id)
    LIMIT 500
  )
  SELECT 
    s.id as company_id,
    s.trade_name,
    (s.score_data->>'priority_score')::numeric as priority_score,
    s.score_data->>'priority_level' as priority_level,
    (s.score_data->'factors'->>'days_inactive')::int as days_inactive
  FROM scored s
  ORDER BY (s.score_data->>'priority_score')::numeric DESC
  LIMIT p_limit;
END;
$function$
