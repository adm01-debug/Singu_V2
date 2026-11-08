CREATE OR REPLACE FUNCTION public.assert_task_access(p_task_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_task_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM tasks WHERE id = p_task_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: task % does not belong to the current user', p_task_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
