CREATE OR REPLACE FUNCTION public.assert_event_access(p_event_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_event_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM calendar_events WHERE id = p_event_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: event % does not belong to the current user', p_event_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
