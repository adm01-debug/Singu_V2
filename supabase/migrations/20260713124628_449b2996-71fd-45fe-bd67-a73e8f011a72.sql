
CREATE OR REPLACE FUNCTION public.cleanup_simulated_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.system_alerts
  WHERE is_simulated = true
    AND created_at < now() - interval '7 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_simulated_alerts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_simulated_alerts() TO service_role;

-- Agendar job semanal (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-simulated-alerts-weekly') THEN
    PERFORM cron.unschedule('cleanup-simulated-alerts-weekly');
  END IF;
  PERFORM cron.schedule(
    'cleanup-simulated-alerts-weekly',
    '0 3 * * 0',
    $cmd$ SELECT public.cleanup_simulated_alerts(); $cmd$
  );
END $$;
