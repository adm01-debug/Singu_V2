CREATE OR REPLACE FUNCTION public.get_visit_agenda(p_user_id uuid DEFAULT auth.uid(), p_start_date date DEFAULT CURRENT_DATE, p_end_date date DEFAULT (CURRENT_DATE + 7))
 RETURNS TABLE(visit_id uuid, company_id uuid, company_name text, visit_date timestamp with time zone, visit_type text, duration_minutes integer, status text, address text, notes text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    v.id as visit_id,
    v.company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as company_name,
    v.visit_date,
    v.visit_type,
    v.duration_minutes,
    v.status,
    COALESCE(a.street || ', ' || a.number || ' - ' || a.city || '/' || a.state, c.city || '/' || c.state) as address,
    v.notes
  FROM scheduled_visits v
  JOIN companies c ON c.id = v.company_id
  LEFT JOIN addresses a ON a.id = v.address_id
  WHERE v.user_id = p_user_id
    AND v.visit_date::date BETWEEN p_start_date AND p_end_date
    AND v.status NOT IN ('cancelled')
  ORDER BY v.visit_date;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$function$
