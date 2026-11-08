CREATE OR REPLACE FUNCTION public.get_rpc_plan_change_counts(_hours integer DEFAULT 6)
 RETURNS TABLE(rpc_name text, changes bigint, last_change timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT s.rpc_name, count(*)::bigint, max(s.captured_at)
    FROM public.rpc_plan_snapshots s
   WHERE s.plan_changed
     AND s.captured_at >= now() - make_interval(hours => LEAST(GREATEST(COALESCE(_hours, 6), 1), 168))
   GROUP BY s.rpc_name
   ORDER BY 2 DESC;
$function$
