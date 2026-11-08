CREATE OR REPLACE FUNCTION public.recalculate_all_lead_scores(p_batch_size integer DEFAULT 1000)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated int := 0;
  v_company RECORD;
BEGIN
  FOR v_company IN 
    SELECT id FROM companies 
    WHERE deleted_at IS NULL 
    ORDER BY lead_score_updated_at NULLS FIRST
    LIMIT p_batch_size
  LOOP
    PERFORM calculate_lead_score(v_company.id);
    v_updated := v_updated + 1;
  END LOOP;
  
  RETURN jsonb_build_object('updated', v_updated, 'batch_size', p_batch_size);
END;
$function$
