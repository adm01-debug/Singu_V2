CREATE OR REPLACE FUNCTION public.trg_fn_recalc_score_after_evaluation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM fn_recalcular_supplier_score(NEW.supplier_id);
  RETURN NEW;
END;
$function$
