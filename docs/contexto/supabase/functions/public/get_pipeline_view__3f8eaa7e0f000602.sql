CREATE OR REPLACE FUNCTION public.get_pipeline_view(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(stage text, total_value numeric, deal_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT ps.nome, COALESCE(SUM(d.valor), 0), COUNT(d.id)
  FROM pipeline_stages ps
  LEFT JOIN deals d ON d.pipeline_stage = ps.nome AND d.status NOT IN ('ganho', 'perdido') AND (p_user_id IS NULL OR d.user_id = p_user_id)
  GROUP BY ps.nome, ps.ordem ORDER BY ps.ordem;
$function$
