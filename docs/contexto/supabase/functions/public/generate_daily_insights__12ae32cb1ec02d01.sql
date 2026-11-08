CREATE OR REPLACE FUNCTION public.generate_daily_insights()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_insights jsonb := '[]'::jsonb;
BEGIN
  -- Insight: Deals parados
  IF (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - interval '7 days') > 0 THEN
    v_insights := v_insights || jsonb_build_object('type', 'warning', 'title', 'Deals Parados', 
      'message', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - interval '7 days') || ' deals sem movimentação há mais de 7 dias');
  END IF;
  
  -- Insight: Meta em risco
  IF EXISTS (SELECT 1 FROM user_goals WHERE period_end >= CURRENT_DATE AND current_value < target_value * 0.5 AND period_end < CURRENT_DATE + interval '10 days') THEN
    v_insights := v_insights || jsonb_build_object('type', 'alert', 'title', 'Metas em Risco', 
      'message', 'Existem metas com menos de 50% alcançado próximas do fim');
  END IF;
  
  -- Insight: Pipeline saudável
  IF (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido')) > 100000 THEN
    v_insights := v_insights || jsonb_build_object('type', 'positive', 'title', 'Pipeline Saudável', 
      'message', 'Pipeline atual com R$ ' || (SELECT ROUND(SUM(valor)/1000, 0) FROM deals WHERE status NOT IN ('ganho', 'perdido')) || 'K em oportunidades');
  END IF;
  
  -- Insight: Clientes inativos
  IF (SELECT COUNT(*) FROM companies WHERE is_customer = true AND deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM interactions WHERE company_id = companies.id AND data_interacao >= NOW() - interval '30 days')) > 10 THEN
    v_insights := v_insights || jsonb_build_object('type', 'action', 'title', 'Clientes Inativos', 
      'message', 'Mais de 10 clientes sem contato há 30+ dias');
  END IF;
  
  RETURN jsonb_build_object('date', CURRENT_DATE, 'insights', v_insights);
END;
$function$
