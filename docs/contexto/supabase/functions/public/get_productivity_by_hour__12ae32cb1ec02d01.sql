CREATE OR REPLACE FUNCTION public.get_productivity_by_hour()
 RETURNS TABLE(hour_of_day integer, interactions bigint, deals_created bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    h.hour::int as hour_of_day,
    COALESCE((SELECT COUNT(*) FROM interactions WHERE EXTRACT(HOUR FROM data_interacao) = h.hour), 0)::bigint as interactions,
    COALESCE((SELECT COUNT(*) FROM deals WHERE EXTRACT(HOUR FROM created_at) = h.hour), 0)::bigint as deals_created
  FROM generate_series(8, 20) as h(hour)
  ORDER BY h.hour;
END;
$function$
