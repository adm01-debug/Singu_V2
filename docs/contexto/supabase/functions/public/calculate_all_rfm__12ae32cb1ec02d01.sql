CREATE OR REPLACE FUNCTION public.calculate_all_rfm()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count int := 0;
  v_company_id uuid;
BEGIN
  FOR v_company_id IN 
    SELECT id FROM companies WHERE deleted_at IS NULL 
    AND id NOT IN (SELECT company_id FROM company_rfm_scores WHERE calculated_at >= NOW() - interval '7 days')
    LIMIT 1000
  LOOP
    PERFORM recalculate_rfm_for_company(v_company_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$function$
