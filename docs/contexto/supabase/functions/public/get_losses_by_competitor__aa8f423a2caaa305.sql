CREATE OR REPLACE FUNCTION public.get_losses_by_competitor(p_days integer DEFAULT 90)
 RETURNS TABLE(competitor_name text, loss_count bigint, total_value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.name, COUNT(d.id), COALESCE(SUM(d.valor), 0)
  FROM competitors c
  LEFT JOIN deals d ON d.motivo_perda ILIKE '%' || c.name || '%' 
    AND d.status = 'perdido' AND d.closed_at >= NOW() - (p_days || ' days')::interval
  GROUP BY c.name ORDER BY 2 DESC;
$function$
