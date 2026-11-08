CREATE OR REPLACE FUNCTION public.get_sales_dashboard(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'pipeline', (
      SELECT jsonb_agg(jsonb_build_object(
        'stage', pipeline_stage,
        'count', cnt,
        'value', total_value
      ))
      FROM (
        SELECT pipeline_stage, COUNT(*) as cnt, COALESCE(SUM(valor), 0) as total_value
        FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado')
          AND (p_user_id IS NULL OR user_id = p_user_id)
        GROUP BY pipeline_stage
      ) t
    ),
    'monthly_won', (
      SELECT jsonb_build_object(
        'count', COUNT(*),
        'value', COALESCE(SUM(valor), 0)
      )
      FROM deals WHERE status = 'ganho' 
        AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)
        AND (p_user_id IS NULL OR user_id = p_user_id)
    ),
    'pending_proposals', (
      SELECT COUNT(*) FROM proposals 
      WHERE status IN ('enviada', 'visualizada')
        AND (p_user_id IS NULL OR user_id = p_user_id)
    ),
    'forecast_30d', (
      SELECT COALESCE(SUM(valor * probabilidade / 100), 0)
      FROM deals WHERE status = 'aberto'
        AND previsao_fechamento <= CURRENT_DATE + 30
        AND (p_user_id IS NULL OR user_id = p_user_id)
    ),
    'updated_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
