CREATE OR REPLACE FUNCTION public.trg_fn_carrier_recalc_score_after_evaluation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM fn_recalcular_carrier_score(NEW.carrier_id);
  RETURN NEW;
END;
$function$
