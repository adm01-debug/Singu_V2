CREATE OR REPLACE FUNCTION public.get_pipeline_velocity(p_days integer DEFAULT 30)
 RETURNS TABLE(stage text, avg_days numeric, deals_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT ps.nome, ROUND(AVG(EXTRACT(EPOCH FROM (d.updated_at - d.created_at))/86400)::numeric, 1), COUNT(d.id)
  FROM pipeline_stages ps LEFT JOIN deals d ON d.pipeline_stage = ps.nome
  GROUP BY ps.nome, ps.ordem ORDER BY ps.ordem;
$function$
