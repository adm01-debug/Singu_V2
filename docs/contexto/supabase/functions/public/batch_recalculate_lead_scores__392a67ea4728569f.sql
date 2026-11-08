CREATE OR REPLACE FUNCTION public.batch_recalculate_lead_scores(p_limit integer DEFAULT 1000)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
  v_company_id uuid;
BEGIN
  FOR v_company_id IN 
    SELECT id FROM companies 
    WHERE deleted_at IS NULL 
      AND status = 'ativo'
    ORDER BY updated_at DESC
    LIMIT p_limit
  LOOP
    PERFORM calculate_lead_score_full(v_company_id);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'companies_processed', v_count
  );
END;
$function$
