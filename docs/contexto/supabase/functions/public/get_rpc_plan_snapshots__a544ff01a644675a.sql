CREATE OR REPLACE FUNCTION public.get_rpc_plan_snapshots(_rpc_name text DEFAULT NULL::text, _limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, rpc_name text, plan_hash text, total_cost numeric, execution_ms numeric, reason text, captured_at timestamp with time zone, plan_changed boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT s.id, s.rpc_name, s.plan_hash, s.total_cost, s.execution_ms, s.reason, s.captured_at,
         s.plan_changed
    FROM public.rpc_plan_snapshots s
   WHERE _rpc_name IS NULL OR s.rpc_name = _rpc_name
   ORDER BY s.captured_at DESC
   LIMIT LEAST(COALESCE(_limit, 20), 200);
$function$
