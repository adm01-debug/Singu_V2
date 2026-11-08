CREATE OR REPLACE FUNCTION public.find_cheapest_model(p_capability text)
 RETURNS TABLE(model text, provider text, tier text, cost double precision, context_window integer)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT m.model, m.provider, m.tier, m.input_cost_per_1m, m.context_window
  FROM model_pricing_v2 m
  WHERE p_capability = ANY(m.capabilities)
  ORDER BY m.input_cost_per_1m
  LIMIT 5;
END;
$function$
