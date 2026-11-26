CREATE OR REPLACE FUNCTION public.get_industry_analysis()
 RETURNS TABLE(ramo text, leads_count bigint, customers bigint, conversion_rate numeric, revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT COALESCE(c.ramo_atividade, 'Não informado'), COUNT(DISTINCT c.id),
    COUNT(DISTINCT c.id) FILTER (WHERE c.is_customer = true),
    ROUND(COUNT(DISTINCT c.id) FILTER (WHERE c.is_customer = true)::numeric / NULLIF(COUNT(DISTINCT c.id), 0) * 100, 1),
    COALESCE(SUM((SELECT SUM(d.valor) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho')), 0)
  FROM companies c WHERE c.deleted_at IS NULL GROUP BY c.ramo_atividade ORDER BY 2 DESC;
$function$
