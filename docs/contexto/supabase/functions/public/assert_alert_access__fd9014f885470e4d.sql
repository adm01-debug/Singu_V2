CREATE OR REPLACE FUNCTION public.assert_alert_access(p_alert_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND p_alert_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM alerts WHERE id = p_alert_id AND user_id = auth.uid())
  THEN
    RAISE EXCEPTION 'Unauthorized: alert % does not belong to the current user', p_alert_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
