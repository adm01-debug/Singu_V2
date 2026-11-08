CREATE OR REPLACE FUNCTION public.assert_notification_access(p_notification_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND p_notification_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM notifications WHERE id = p_notification_id AND user_id = auth.uid())
  THEN
    RAISE EXCEPTION 'Unauthorized: notification % does not belong to the current user', p_notification_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
