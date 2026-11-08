CREATE OR REPLACE FUNCTION public.update_all_lead_scores(p_limit integer DEFAULT 1000)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
  v_count int := 0;
BEGIN
  FOR v_company_id IN 
    SELECT id FROM companies 
    WHERE deleted_at IS NULL 
      AND (lead_score_updated_at IS NULL OR lead_score_updated_at < NOW() - INTERVAL '1 day')
    ORDER BY lead_score_updated_at NULLS FIRST
    LIMIT p_limit
  LOOP
    PERFORM calculate_lead_score(v_company_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$function$
