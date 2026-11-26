CREATE OR REPLACE FUNCTION public.get_industry_roi()
 RETURNS TABLE(ramo text, leads bigint, revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT COALESCE(c.ramo_atividade, 'Não informado'), COUNT(DISTINCT c.id),
    COALESCE(SUM((SELECT SUM(d.valor) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho')), 0)
  FROM companies c WHERE c.deleted_at IS NULL GROUP BY c.ramo_atividade ORDER BY 3 DESC;
$function$
