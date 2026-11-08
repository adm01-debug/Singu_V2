CREATE OR REPLACE FUNCTION public.get_coaching_suggestions(p_user_id uuid)
 RETURNS TABLE(area text, current_status text, suggestion text, priority text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_conv_rate numeric; v_avg_cycle numeric; v_activity int; v_benchmark_conv numeric; v_benchmark_cycle numeric;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Calcular métricas do usuário
  SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) INTO v_conv_rate FROM deals WHERE user_id = p_user_id;
  SELECT ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 1) INTO v_avg_cycle FROM deals WHERE user_id = p_user_id AND status = 'ganho';
  SELECT COUNT(*) INTO v_activity FROM interactions WHERE user_id = p_user_id AND data_interacao >= NOW() - interval '7 days';
  
  -- Benchmark
  SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) INTO v_benchmark_conv FROM deals;
  SELECT ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 1) INTO v_benchmark_cycle FROM deals WHERE status = 'ganho';
  
  -- Sugestões baseadas em gaps
  IF v_conv_rate < v_benchmark_conv * 0.8 THEN
    RETURN QUERY SELECT 'Taxa de Conversão'::text, v_conv_rate || '% (benchmark: ' || v_benchmark_conv || '%)', 'Revisar qualificação de leads e pitch de vendas', 'ALTA'::text;
  END IF;
  
  IF v_avg_cycle > v_benchmark_cycle * 1.3 THEN
    RETURN QUERY SELECT 'Ciclo de Vendas', v_avg_cycle || ' dias (benchmark: ' || v_benchmark_cycle || ' dias)', 'Acelerar follow-ups e reduzir tempo entre etapas', 'MÉDIA';
  END IF;
  
  IF v_activity < 20 THEN
    RETURN QUERY SELECT 'Volume de Atividade', v_activity || ' interações nos últimos 7 dias', 'Aumentar quantidade de contatos diários', 'ALTA';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM deals WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido') AND probabilidade >= 70) THEN
    RETURN QUERY SELECT 'Pipeline Qualificado', 'Nenhum deal com alta probabilidade', 'Focar em qualificação de oportunidades existentes', 'MÉDIA';
  END IF;
  
  -- Se tudo estiver bem
  IF v_conv_rate >= v_benchmark_conv AND v_avg_cycle <= v_benchmark_cycle AND v_activity >= 20 THEN
    RETURN QUERY SELECT 'Performance Geral', 'Acima da média', 'Continue o excelente trabalho! Considere mentorar colegas', 'INFO';
  END IF;
END;
$function$
