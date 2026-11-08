CREATE OR REPLACE FUNCTION public.assert_visit_access(p_visit_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND p_visit_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM scheduled_visits WHERE id = p_visit_id AND user_id = auth.uid())
  THEN
    RAISE EXCEPTION 'Unauthorized: visit % does not belong to the current user', p_visit_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
