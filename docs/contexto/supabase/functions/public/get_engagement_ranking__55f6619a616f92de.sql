CREATE OR REPLACE FUNCTION public.get_engagement_ranking(p_user_id uuid DEFAULT NULL::uuid, p_min_score numeric DEFAULT 0, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, trade_name text, engagement_score numeric, engagement_level text, interactions_30d integer, last_interaction timestamp with time zone)
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
      COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as company_name,
      calculate_engagement_score(c.id) as score_data
    FROM companies c
    WHERE c.status = 'ativo'
      AND (p_user_id IS NULL OR c.user_id = p_user_id)
  )
  SELECT 
    s.id as company_id,
    s.company_name as trade_name,
    (s.score_data->>'engagement_score')::numeric as engagement_score,
    s.score_data->>'engagement_level' as engagement_level,
    (s.score_data->'factors'->>'interactions_30d')::int as interactions_30d,
    (SELECT MAX(data_interacao) FROM interactions i WHERE i.company_id = s.id) as last_interaction
  FROM scored s
  WHERE (s.score_data->>'engagement_score')::numeric >= p_min_score
  ORDER BY (s.score_data->>'engagement_score')::numeric DESC
  LIMIT p_limit;
END;
$function$
