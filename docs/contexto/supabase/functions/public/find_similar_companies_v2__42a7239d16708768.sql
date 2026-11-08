CREATE OR REPLACE FUNCTION public.find_similar_companies_v2(p_company_id uuid, p_limit integer DEFAULT 5)
 RETURNS TABLE(company_id uuid, trade_name text, segment text, state text, similarity_score numeric, similarity_factors text[])
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_source record;
BEGIN
  SELECT * INTO v_source FROM companies WHERE id = p_company_id;
  
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as trade_name,
    c.ramo_atividade as segment,
    c.state,
    (
      CASE WHEN c.ramo_atividade = v_source.ramo_atividade THEN 40 ELSE 0 END +
      CASE WHEN c.state = v_source.state THEN 30 ELSE 0 END +
      CASE WHEN c.city = v_source.city THEN 20 ELSE 0 END +
      CASE WHEN c.tags_array && v_source.tags_array THEN 10 ELSE 0 END
    )::numeric as similarity_score,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN c.ramo_atividade = v_source.ramo_atividade THEN 'mesmo_segmento' END,
      CASE WHEN c.state = v_source.state THEN 'mesmo_estado' END,
      CASE WHEN c.city = v_source.city THEN 'mesma_cidade' END,
      CASE WHEN c.tags_array && v_source.tags_array THEN 'tags_em_comum' END
    ], NULL) as similarity_factors
  FROM companies c
  WHERE c.id != p_company_id
    AND c.status = 'ativo'
    AND (
      c.ramo_atividade = v_source.ramo_atividade OR
      c.state = v_source.state OR
      c.tags_array && v_source.tags_array
    )
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$function$
