CREATE OR REPLACE FUNCTION public.get_user_calendar(p_user_id uuid, p_start_date date DEFAULT CURRENT_DATE, p_days integer DEFAULT 7)
 RETURNS TABLE(event_id uuid, title text, event_type text, start_time timestamp with time zone, end_time timestamp with time zone, company_name text, status text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT ce.id, ce.title::text, ce.event_type::text, ce.start_time, ce.end_time,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    ce.status::text
  FROM calendar_events ce
  LEFT JOIN companies c ON c.id = ce.company_id
  WHERE ce.user_id = p_user_id
    AND ce.start_time >= p_start_date
    AND ce.start_time < p_start_date + (p_days || ' days')::interval
    AND ce.status != 'cancelled'
  ORDER BY ce.start_time;
END;
$function$
