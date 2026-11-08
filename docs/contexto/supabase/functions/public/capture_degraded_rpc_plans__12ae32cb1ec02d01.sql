CREATE OR REPLACE FUNCTION public.capture_degraded_rpc_plans()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  r       record;
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT t.rpc_name FROM public.get_slow_rpc_trend(1, 24, 20) t
     WHERE t.is_degraded
       AND t.rpc_name IN ('get_ai_gateway_health', 'get_ai_gateway_partition_stats',
                          'get_rpc_perf_stats', 'get_top_slow_rpcs', 'get_slow_rpc_trend')
  LOOP
    IF public.capture_rpc_plan(r.rpc_name, 'degradation') IS NOT NULL THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  FOR r IN
    SELECT unnest(ARRAY['get_ai_gateway_health', 'get_ai_gateway_partition_stats',
                        'get_rpc_perf_stats', 'get_top_slow_rpcs', 'get_slow_rpc_trend']) AS rpc_name
  LOOP
    IF public.capture_rpc_plan(r.rpc_name, 'scheduled') IS NOT NULL THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  DELETE FROM public.rpc_plan_snapshots WHERE captured_at < now() - interval '30 days';
  RETURN v_count;
END;
$function$
