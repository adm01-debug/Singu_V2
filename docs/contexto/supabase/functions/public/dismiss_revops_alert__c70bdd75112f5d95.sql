CREATE OR REPLACE FUNCTION public.dismiss_revops_alert(_alert_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.revops_alerts
  SET dismissed = true
  WHERE id = _alert_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$function$
