CREATE OR REPLACE FUNCTION public.update_forecast_actual(p_month date, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actual numeric;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT COALESCE(SUM(valor), 0)
  INTO v_actual
  FROM deals
  WHERE status = 'ganho'
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND DATE_TRUNC('month', closed_at) = DATE_TRUNC('month', p_month);
  
  UPDATE sales_forecasts
  SET actual_value = v_actual, updated_at = now()
  WHERE forecast_month = DATE_TRUNC('month', p_month)::date
    AND (user_id = p_user_id OR (p_user_id IS NULL AND user_id IS NULL));
  
  RETURN jsonb_build_object(
    'success', true,
    'month', DATE_TRUNC('month', p_month),
    'actual_value', v_actual
  );
END;
$function$
