CREATE OR REPLACE FUNCTION public.assert_violation_access(p_violation_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND p_violation_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM sla_violations WHERE id = p_violation_id AND user_id = auth.uid())
  THEN
    RAISE EXCEPTION 'Unauthorized: SLA violation % does not belong to the current user', p_violation_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
