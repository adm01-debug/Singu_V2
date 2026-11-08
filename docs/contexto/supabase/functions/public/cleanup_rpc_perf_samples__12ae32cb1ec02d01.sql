CREATE OR REPLACE FUNCTION public.cleanup_rpc_perf_samples()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.rpc_perf_samples WHERE created_at < now() - interval '7 days';
END;
$function$
