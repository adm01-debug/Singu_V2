CREATE OR REPLACE FUNCTION public.get_all_tasks()
 RETURNS SETOF tasks
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT * FROM tasks
  WHERE user_id = auth.uid()
  ORDER BY due_date ASC NULLS LAST, created_at DESC;
$function$
