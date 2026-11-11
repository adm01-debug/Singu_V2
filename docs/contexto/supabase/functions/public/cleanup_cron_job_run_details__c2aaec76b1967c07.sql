CREATE OR REPLACE FUNCTION public.cleanup_cron_job_run_details(_dias integer DEFAULT 7)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _apagadas bigint;
BEGIN
  IF _dias < 1 THEN
    RAISE EXCEPTION 'retencao minima de 1 dia (recebido: %)', _dias;
  END IF;
  DELETE FROM cron.job_run_details
   WHERE start_time < now() - make_interval(days => _dias);
  GET DIAGNOSTICS _apagadas = ROW_COUNT;
  RETURN _apagadas;
END;
$function$
