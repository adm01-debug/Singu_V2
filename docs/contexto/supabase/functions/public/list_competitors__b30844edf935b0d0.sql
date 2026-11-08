CREATE OR REPLACE FUNCTION public.list_competitors(p_active_only boolean DEFAULT true)
 RETURNS TABLE(id uuid, name text, website text, pricing_tier text, strengths text[], weaknesses text[], losses_count integer, total_value_lost numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.website,
    c.pricing_tier,
    c.strengths,
    c.weaknesses,
    (SELECT COUNT(*) FROM competitive_losses WHERE competitor_id = c.id)::integer,
    (SELECT COALESCE(SUM(d.valor), 0) FROM competitive_losses cl JOIN deals d ON d.id = cl.deal_id WHERE cl.competitor_id = c.id)
  FROM competitors c
  WHERE (NOT p_active_only OR c.is_active = true)
  ORDER BY c.name;
END;
$function$
