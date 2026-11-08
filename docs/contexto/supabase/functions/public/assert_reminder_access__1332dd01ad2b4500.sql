CREATE OR REPLACE FUNCTION public.assert_reminder_access(p_reminder_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_reminder_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM reminders WHERE id = p_reminder_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: reminder % does not belong to the current user', p_reminder_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
