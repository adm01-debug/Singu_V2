CREATE OR REPLACE FUNCTION public.get_rpc_plan_diff(_rpc_name text)
 RETURNS TABLE(slot text, id uuid, rpc_name text, plan_hash text, total_cost numeric, execution_ms numeric, reason text, captured_at timestamp with time zone, plan jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH last_two AS (
    SELECT s.*, row_number() OVER (ORDER BY s.captured_at DESC) AS rn
      FROM public.rpc_plan_snapshots s
     WHERE s.rpc_name = _rpc_name
     ORDER BY s.captured_at DESC
     LIMIT 2
  )
  SELECT CASE WHEN l.rn = 1 THEN 'current' ELSE 'previous' END,
         l.id, l.rpc_name, l.plan_hash, l.total_cost, l.execution_ms, l.reason, l.captured_at, l.plan
    FROM last_two l
   ORDER BY l.rn;
$function$
