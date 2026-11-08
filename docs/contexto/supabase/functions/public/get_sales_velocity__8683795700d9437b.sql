CREATE OR REPLACE FUNCTION public.get_sales_velocity(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_total_deals int;
  v_won_deals int;
  v_avg_deal_value numeric;
  v_avg_cycle_days numeric;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Busca deals do período
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'ganho'),
    COALESCE(AVG(valor) FILTER (WHERE status = 'ganho'), 0)
  INTO v_total_deals, v_won_deals, v_avg_deal_value
  FROM deals
  WHERE created_at >= NOW() - (p_days || ' days')::interval
    AND (p_user_id IS NULL OR user_id = p_user_id);
  
  -- Ciclo médio (dias entre criação e fechamento)
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400), 0)
  INTO v_avg_cycle_days
  FROM deals
  WHERE status = 'ganho'
    AND updated_at >= NOW() - (p_days || ' days')::interval
    AND (p_user_id IS NULL OR user_id = p_user_id);

  v_result := jsonb_build_object(
    'period_days', p_days,
    'total_deals', v_total_deals,
    'won_deals', v_won_deals,
    'win_rate', CASE WHEN v_total_deals > 0 THEN ROUND((v_won_deals::numeric / v_total_deals) * 100, 2) ELSE 0 END,
    'avg_deal_value', ROUND(v_avg_deal_value, 2),
    'avg_cycle_days', ROUND(v_avg_cycle_days, 1),
    'velocity', CASE WHEN v_avg_cycle_days > 0 
      THEN ROUND((v_won_deals * v_avg_deal_value) / NULLIF(v_avg_cycle_days, 0), 2) 
      ELSE 0 
    END,
    'calculated_at', NOW()
  );
  
  RETURN v_result;
END;
$function$
