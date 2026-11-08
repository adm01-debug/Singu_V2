CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(p_days_old integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted int;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  DELETE FROM notifications
  WHERE created_at < NOW() - (p_days_old || ' days')::interval
    AND COALESCE(is_read, false) = true;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$
