CREATE OR REPLACE FUNCTION public.fn_supplier_bulk_recalc()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_rec RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT se.supplier_id
    FROM supplier_evaluations se
  LOOP
    PERFORM fn_recalcular_supplier_score(v_rec.supplier_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object('recalculated', v_count, 'executed_at', NOW());
END;
$function$
