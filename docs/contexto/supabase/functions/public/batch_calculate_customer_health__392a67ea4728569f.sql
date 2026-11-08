CREATE OR REPLACE FUNCTION public.batch_calculate_customer_health(p_limit integer DEFAULT 500)
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
    WHERE is_customer = true 
      AND deleted_at IS NULL 
      AND status = 'ativo'
    LIMIT p_limit
  LOOP
    PERFORM calculate_customer_health(v_company_id);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'customers_processed', v_count
  );
END;
$function$
