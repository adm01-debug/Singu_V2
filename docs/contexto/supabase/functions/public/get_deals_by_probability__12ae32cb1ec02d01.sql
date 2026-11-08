CREATE OR REPLACE FUNCTION public.get_deals_by_probability()
 RETURNS TABLE(probability_range text, deal_count bigint, total_value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN probabilidade >= 80 THEN '80-100%' WHEN probabilidade >= 60 THEN '60-79%' WHEN probabilidade >= 40 THEN '40-59%' ELSE '0-39%' END,
    COUNT(*), COALESCE(SUM(valor), 0)
  FROM deals WHERE status NOT IN ('ganho', 'perdido') GROUP BY 1 ORDER BY MIN(probabilidade) DESC;
$function$
