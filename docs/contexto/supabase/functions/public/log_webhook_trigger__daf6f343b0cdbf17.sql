CREATE OR REPLACE FUNCTION public.log_webhook_trigger(p_webhook_id uuid, p_event text, p_payload jsonb, p_success boolean)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE webhooks SET 
    last_triggered_at = NOW(),
    failure_count = CASE WHEN p_success THEN 0 ELSE failure_count + 1 END
  WHERE id = p_webhook_id;
END;
$function$
