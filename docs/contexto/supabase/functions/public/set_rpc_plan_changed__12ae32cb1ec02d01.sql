CREATE OR REPLACE FUNCTION public.set_rpc_plan_changed()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prev text;
BEGIN
  SELECT plan_hash INTO v_prev
    FROM public.rpc_plan_snapshots
   WHERE rpc_name = NEW.rpc_name
   ORDER BY captured_at DESC
   LIMIT 1;

  NEW.plan_changed := v_prev IS NOT NULL AND v_prev IS DISTINCT FROM NEW.plan_hash;
  RETURN NEW;
END;
$function$
