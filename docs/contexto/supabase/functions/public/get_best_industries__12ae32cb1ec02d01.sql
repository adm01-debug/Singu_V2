CREATE OR REPLACE FUNCTION public.get_best_industries()
 RETURNS TABLE(ramo text, quality_score numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT COALESCE(c.ramo_atividade, 'Não informado'),
    ROUND(COUNT(DISTINCT c.id) FILTER (WHERE c.is_customer = true)::numeric / NULLIF(COUNT(DISTINCT c.id), 0) * 100, 1)
  FROM companies c WHERE c.deleted_at IS NULL GROUP BY c.ramo_atividade ORDER BY 2 DESC;
$function$
