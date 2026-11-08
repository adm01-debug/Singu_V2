CREATE OR REPLACE FUNCTION public.get_source_conversion_stats(p_days integer DEFAULT 90)
 RETURNS TABLE(source text, total_companies bigint, with_interaction bigint, conversion_rate numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(c.source, 'Não definido') as source,
    COUNT(*) as total_companies,
    COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id)) as with_interaction,
    ROUND(
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id))::numeric / 
      NULLIF(COUNT(*), 0)::numeric * 100, 2
    ) as conversion_rate
  FROM companies c
  WHERE c.created_at >= NOW() - (p_days || ' days')::interval
  GROUP BY c.source
  ORDER BY total_companies DESC;
END;
$function$
