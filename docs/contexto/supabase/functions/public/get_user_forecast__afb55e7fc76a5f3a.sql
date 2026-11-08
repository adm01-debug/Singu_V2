CREATE OR REPLACE FUNCTION public.get_user_forecast(p_user_id uuid, p_months integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT jsonb_build_object(
      'user_id', p_user_id,
      'pipeline_total', COALESCE(SUM(valor), 0),
      'weighted_forecast', COALESCE(SUM(valor * probabilidade / 100), 0),
      'deals_count', COUNT(*),
      'avg_deal_size', COALESCE(AVG(valor), 0),
      'closing_this_month', (
        SELECT COALESCE(SUM(valor), 0) FROM deals 
        WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido', 'arquivado')
          AND previsao_fechamento BETWEEN CURRENT_DATE AND DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'
      )
    )
    FROM deals
    WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido', 'arquivado')
      AND previsao_fechamento <= CURRENT_DATE + (p_months || ' months')::interval
  );
END;
$function$
