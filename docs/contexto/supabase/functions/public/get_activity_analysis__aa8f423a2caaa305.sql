CREATE OR REPLACE FUNCTION public.get_activity_analysis(p_days integer DEFAULT 30)
 RETURNS TABLE(activity_type text, total bigint, avg_per_day numeric, companies_touched bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date date := CURRENT_DATE - p_days;
BEGIN
  RETURN QUERY
  SELECT 
    i.type::text as activity_type,
    COUNT(*)::bigint as total,
    ROUND(COUNT(*) * 1.0 / p_days, 1)::numeric as avg_per_day,
    COUNT(DISTINCT i.company_id)::bigint as companies_touched
  FROM interactions i
  WHERE i.data_interacao >= v_start_date
  GROUP BY i.type
  ORDER BY total DESC;
END;
$function$
