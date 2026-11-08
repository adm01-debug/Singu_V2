CREATE OR REPLACE FUNCTION public.get_proposals_summary(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_total int;
  v_aceitas int;
  v_rejeitadas int;
  v_pendentes int;
  v_valor_total numeric;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'aceita'),
    COUNT(*) FILTER (WHERE status = 'rejeitada'),
    COUNT(*) FILTER (WHERE status IN ('enviada', 'visualizada')),
    COALESCE(SUM(valor_final) FILTER (WHERE status = 'aceita'), 0)
  INTO v_total, v_aceitas, v_rejeitadas, v_pendentes, v_valor_total
  FROM proposals
  WHERE created_at >= NOW() - (p_days || ' days')::interval
    AND (p_user_id IS NULL OR user_id = p_user_id);

  v_result := jsonb_build_object(
    'period_days', p_days,
    'total', v_total,
    'aceitas', v_aceitas,
    'rejeitadas', v_rejeitadas,
    'pendentes', v_pendentes,
    'taxa_conversao', CASE WHEN v_total > 0 THEN ROUND((v_aceitas::numeric / v_total) * 100, 2) ELSE 0 END,
    'valor_total_ganho', v_valor_total,
    'calculated_at', NOW()
  );
  
  RETURN v_result;
END;
$function$
