CREATE OR REPLACE FUNCTION public.get_top_slow_rpcs(_hours integer DEFAULT 24, _limit integer DEFAULT 5)
 RETURNS TABLE(rpc_name text, samples integer, p95_ms numeric, p99_ms numeric, max_ms numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access_denied' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT s.rpc_name,
         COUNT(*)::int,
         ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms))::numeric, 1),
         ROUND((percentile_cont(0.99) WITHIN GROUP (ORDER BY s.duration_ms))::numeric, 1),
         ROUND(MAX(s.duration_ms), 1)
    FROM public.rpc_perf_samples s
   WHERE s.created_at >= now() - make_interval(hours => _hours)
   GROUP BY s.rpc_name
  HAVING COUNT(*) >= 3
   ORDER BY percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms) DESC
   LIMIT COALESCE(_limit, 5);
END;
$function$
