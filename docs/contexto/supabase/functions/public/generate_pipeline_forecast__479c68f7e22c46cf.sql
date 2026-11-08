CREATE OR REPLACE FUNCTION public.generate_pipeline_forecast(p_user_id uuid DEFAULT NULL::uuid, p_months_ahead integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_month date;
  v_forecast_value numeric;
  v_result jsonb := '[]';
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  FOR i IN 0..(p_months_ahead - 1) LOOP
    v_month := DATE_TRUNC('month', CURRENT_DATE + (i || ' month')::interval)::date;
    
    -- Calcular forecast ponderado
    SELECT COALESCE(SUM(valor * (probabilidade::numeric / 100)), 0)
    INTO v_forecast_value
    FROM deals
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND status NOT IN ('ganho', 'perdido')
      AND previsao_fechamento IS NOT NULL
      AND DATE_TRUNC('month', previsao_fechamento) = v_month;
    
    -- Salvar forecast
    INSERT INTO sales_forecasts (forecast_month, user_id, forecast_type, predicted_value, confidence_level)
    VALUES (v_month, p_user_id, 'pipeline', v_forecast_value, 0.7)
    ON CONFLICT (forecast_month, user_id, forecast_type) DO UPDATE
    SET predicted_value = v_forecast_value, updated_at = now();
    
    v_result := v_result || jsonb_build_object(
      'month', v_month,
      'predicted_value', v_forecast_value
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'forecasts', v_result
  );
END;
$function$
