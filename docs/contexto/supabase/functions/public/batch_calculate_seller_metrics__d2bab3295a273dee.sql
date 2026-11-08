CREATE OR REPLACE FUNCTION public.batch_calculate_seller_metrics(p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
  v_user_id uuid;
BEGIN
  FOR v_user_id IN 
    SELECT id FROM profiles WHERE is_active = true
  LOOP
    PERFORM calculate_seller_daily_metrics(v_user_id, p_date);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'sellers_processed', v_count,
    'date', p_date
  );
END;
$function$
