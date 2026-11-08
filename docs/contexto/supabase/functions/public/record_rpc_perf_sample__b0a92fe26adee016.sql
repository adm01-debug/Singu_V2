CREATE OR REPLACE FUNCTION public.record_rpc_perf_sample(_rpc_name text, _duration_ms numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.rpc_perf_samples (rpc_name, duration_ms) VALUES (_rpc_name, _duration_ms);
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$function$
