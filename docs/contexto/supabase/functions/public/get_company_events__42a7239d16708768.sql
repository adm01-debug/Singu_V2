CREATE OR REPLACE FUNCTION public.get_company_events(p_company_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(event_id uuid, title text, event_type text, start_time timestamp with time zone, status text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT ce.id, ce.title::text, ce.event_type::text, ce.start_time, ce.status::text
  FROM calendar_events ce
  WHERE ce.company_id = p_company_id AND ce.status != 'cancelled'
  ORDER BY ce.start_time DESC
  LIMIT p_limit;
END;
$function$
