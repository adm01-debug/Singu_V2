CREATE OR REPLACE FUNCTION public.assert_goal_access(p_goal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND p_goal_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM sales_goals WHERE id = p_goal_id AND user_id = auth.uid())
  THEN
    RAISE EXCEPTION 'Unauthorized: goal % does not belong to the current user', p_goal_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
