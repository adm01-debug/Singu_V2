CREATE OR REPLACE FUNCTION public.get_tasks_by_contact(p_contact_id uuid)
 RETURNS SETOF tasks
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
  RETURN QUERY
  SELECT * FROM tasks
  WHERE contact_id = p_contact_id AND user_id = auth.uid()
  ORDER BY due_date ASC NULLS LAST, created_at DESC;
END;
$function$
