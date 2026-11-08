CREATE OR REPLACE FUNCTION public.resolve_alerts_batch(p_alert_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result jsonb;
  affected int;
BEGIN
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM alerts
    WHERE id = ANY(p_alert_ids) AND user_id IS DISTINCT FROM auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: one or more alerts do not belong to you'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE alerts SET resolved_at = now()
  WHERE id = ANY(p_alert_ids) AND resolved_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;

  SELECT jsonb_build_object(
    'success', true,
    'total_enviados', array_length(p_alert_ids, 1),
    'total_resolvidos', affected,
    'resolved_at', now()
  ) INTO result;

  RETURN result;
END;
$function$
