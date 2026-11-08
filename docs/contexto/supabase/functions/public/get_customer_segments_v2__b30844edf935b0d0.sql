CREATE OR REPLACE FUNCTION public.get_customer_segments_v2(p_active_only boolean DEFAULT true)
 RETURNS TABLE(id uuid, name text, description text, segment_type text, company_count integer, is_active boolean, last_refreshed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.name,
    cs.description,
    cs.segment_type,
    cs.company_count,
    cs.is_active,
    cs.last_refreshed_at
  FROM customer_segments cs
  WHERE (NOT p_active_only OR cs.is_active = true)
  ORDER BY cs.company_count DESC;
END;
$function$
