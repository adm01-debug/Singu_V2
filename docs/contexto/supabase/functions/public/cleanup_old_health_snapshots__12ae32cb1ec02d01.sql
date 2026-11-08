CREATE OR REPLACE FUNCTION public.cleanup_old_health_snapshots()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.system_health_snapshots
  WHERE timestamp < now() - INTERVAL '60 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM public.system_alerts
  WHERE acknowledged_at IS NOT NULL
    AND created_at < now() - INTERVAL '90 days';

  RETURN deleted_count;
END;
$function$
