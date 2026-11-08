CREATE OR REPLACE FUNCTION public.reschedule_visit(p_visit_id uuid, p_new_date timestamp with time zone, p_reason text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_visit_access(p_visit_id);
  UPDATE scheduled_visits 
  SET visit_date = p_new_date, 
      status = 'rescheduled',
      notes = COALESCE(notes, '') || ' | Reagendado: ' || COALESCE(p_reason, 'sem motivo informado')
  WHERE id = p_visit_id;
  
  RETURN FOUND;
END;
$function$
