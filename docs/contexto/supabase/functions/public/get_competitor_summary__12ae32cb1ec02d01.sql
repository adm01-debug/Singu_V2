CREATE OR REPLACE FUNCTION public.get_competitor_summary()
 RETURNS TABLE(competitor_id uuid, name text, price_level text, deals_lost_to bigint, total_lost_value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.price_level,
    (SELECT COUNT(*) FROM deals d WHERE d.status = 'perdido' AND d.motivo_perda ILIKE '%' || c.name || '%'),
    (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.status = 'perdido' AND d.motivo_perda ILIKE '%' || c.name || '%')
  FROM competitors c WHERE c.is_active = true ORDER BY 4 DESC;
$function$
