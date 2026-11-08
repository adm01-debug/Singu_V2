CREATE OR REPLACE FUNCTION public.get_competitor_analysis()
 RETURNS TABLE(competitor_id uuid, competitor_name text, deals_competing bigint, wins bigint, losses bigint, win_rate numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as competitor_id,
    c.name::text as competitor_name,
    COUNT(*)::bigint as deals_competing,
    COUNT(*) FILTER (WHERE dc.status = 'won_against')::bigint as wins,
    COUNT(*) FILTER (WHERE dc.status = 'lost_to')::bigint as losses,
    ROUND(
      COUNT(*) FILTER (WHERE dc.status = 'won_against')::numeric / 
      NULLIF(COUNT(*) FILTER (WHERE dc.status IN ('won_against', 'lost_to')), 0) * 100, 2
    ) as win_rate
  FROM competitors c
  LEFT JOIN deal_competitors dc ON dc.competitor_id = c.id
  WHERE c.is_active = true
  GROUP BY c.id, c.name
  ORDER BY deals_competing DESC;
END;
$function$
