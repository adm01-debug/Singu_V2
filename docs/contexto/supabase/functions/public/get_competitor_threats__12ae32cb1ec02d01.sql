CREATE OR REPLACE FUNCTION public.get_competitor_threats()
 RETURNS TABLE(competitor_name text, threat_level text, recent_losses bigint, market_position text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.name,
    CASE 
      WHEN (SELECT COUNT(*) FROM deals d WHERE d.status = 'perdido' AND d.motivo_perda ILIKE '%' || c.name || '%' AND d.closed_at >= NOW() - interval '90 days') >= 3 THEN 'ALTO'
      WHEN (SELECT COUNT(*) FROM deals d WHERE d.status = 'perdido' AND d.motivo_perda ILIKE '%' || c.name || '%' AND d.closed_at >= NOW() - interval '90 days') >= 1 THEN 'MÉDIO'
      ELSE 'BAIXO'
    END,
    (SELECT COUNT(*) FROM deals d WHERE d.status = 'perdido' AND d.motivo_perda ILIKE '%' || c.name || '%' AND d.closed_at >= NOW() - interval '90 days'),
    c.price_level
  FROM competitors c WHERE c.is_active = true ORDER BY 3 DESC;
$function$
