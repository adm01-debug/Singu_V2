CREATE OR REPLACE FUNCTION public.get_upcoming_meetings(p_user_id uuid, p_days integer DEFAULT 7)
 RETURNS TABLE(meeting_id uuid, title text, company_name text, contact_name text, meeting_type text, scheduled_at timestamp with time zone, duration_minutes integer, status text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    m.id as meeting_id,
    m.title::text,
    COALESCE(c.nome_fantasia, c.nome_crm)::text as company_name,
    COALESCE(ct.full_name, ct.first_name)::text as contact_name,
    m.meeting_type::text,
    m.scheduled_at,
    m.duration_minutes,
    m.status::text
  FROM meetings m
  LEFT JOIN companies c ON c.id = m.company_id
  LEFT JOIN contacts ct ON ct.id = m.contact_id
  WHERE m.user_id = p_user_id
    AND m.scheduled_at BETWEEN NOW() AND NOW() + (p_days || ' days')::interval
    AND m.status NOT IN ('cancelled', 'completed')
  ORDER BY m.scheduled_at;
END;
$function$
