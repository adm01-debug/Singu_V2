CREATE OR REPLACE FUNCTION public.get_deals_pipeline(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(stage text, deal_count bigint, total_value numeric, avg_value numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    d.pipeline_stage as stage,
    COUNT(*)::bigint as deal_count,
    COALESCE(SUM(d.valor), 0)::numeric as total_value,
    COALESCE(AVG(d.valor), 0)::numeric as avg_value
  FROM deals d
  WHERE d.status NOT IN ('perdido', 'arquivado')
    AND (p_user_id IS NULL OR d.user_id = p_user_id)
  GROUP BY d.pipeline_stage
  ORDER BY CASE d.pipeline_stage
    WHEN 'lead' THEN 1
    WHEN 'qualificado' THEN 2
    WHEN 'proposta' THEN 3
    WHEN 'negociacao' THEN 4
    WHEN 'fechamento' THEN 5
    ELSE 99
  END;
END;
$function$
