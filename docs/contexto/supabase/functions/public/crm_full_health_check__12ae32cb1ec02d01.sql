CREATE OR REPLACE FUNCTION public.crm_full_health_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_results jsonb := '{}';
  v_score int := 0;
  v_max_score int := 25;
BEGIN
  -- 1. Dashboard
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_dashboard_summary') THEN
    v_results := v_results || jsonb_build_object('dashboard', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('dashboard', '❌ FALHA'); END IF;

  -- 2. Empresas 360
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_company_360') THEN
    v_results := v_results || jsonb_build_object('empresas_360', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('empresas_360', '❌ FALHA'); END IF;

  -- 3. Pipeline
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_pipeline_summary') THEN
    v_results := v_results || jsonb_build_object('pipeline', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('pipeline', '❌ FALHA'); END IF;

  -- 4. RFM
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_rfm_score') THEN
    v_results := v_results || jsonb_build_object('rfm', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('rfm', '❌ FALHA'); END IF;

  -- 5. Metas
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_goals_dashboard') THEN
    v_results := v_results || jsonb_build_object('metas', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('metas', '❌ FALHA'); END IF;

  -- 6. Gamificação
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_badges') THEN
    v_results := v_results || jsonb_build_object('gamificacao', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('gamificacao', '❌ FALHA'); END IF;

  -- 7. Busca Global
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'global_search') THEN
    v_results := v_results || jsonb_build_object('busca_global', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('busca_global', '❌ FALHA'); END IF;

  -- 8. Alertas
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_critical_alerts') THEN
    v_results := v_results || jsonb_build_object('alertas', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('alertas', '❌ FALHA'); END IF;

  -- 9. Notificações
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_unread_notifications') THEN
    v_results := v_results || jsonb_build_object('notificacoes', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('notificacoes', '❌ FALHA'); END IF;

  -- 10. Territórios
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_territories') THEN
    v_results := v_results || jsonb_build_object('territorios', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('territorios', '❌ FALHA'); END IF;

  -- 11. Previsões IA
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'predict_deal_outcome') THEN
    v_results := v_results || jsonb_build_object('previsoes_ia', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('previsoes_ia', '❌ FALHA'); END IF;

  -- 12. Qualidade Dados
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_data_quality_score') THEN
    v_results := v_results || jsonb_build_object('qualidade_dados', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('qualidade_dados', '❌ FALHA'); END IF;

  -- 13. Campanhas
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_campaigns') THEN
    v_results := v_results || jsonb_build_object('campanhas', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('campanhas', '❌ FALHA'); END IF;

  -- 14. Plano Diário
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_daily_action_plan') THEN
    v_results := v_results || jsonb_build_object('plano_diario', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('plano_diario', '❌ FALHA'); END IF;

  -- 15. Relatórios
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_sales_report') THEN
    v_results := v_results || jsonb_build_object('relatorios', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('relatorios', '❌ FALHA'); END IF;

  -- 16. Enriquecimento CNPJ
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'apply_cnpj_enrichment') THEN
    v_results := v_results || jsonb_build_object('enriquecimento_cnpj', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('enriquecimento_cnpj', '❌ FALHA'); END IF;

  -- 17. Reativação
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_reactivation_tasks') THEN
    v_results := v_results || jsonb_build_object('reativacao', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('reativacao', '❌ FALHA'); END IF;

  -- 18. WhatsApp
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_whatsapp_message') THEN
    v_results := v_results || jsonb_build_object('whatsapp', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('whatsapp', '❌ FALHA'); END IF;

  -- 19. Webhooks
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'register_webhook') THEN
    v_results := v_results || jsonb_build_object('webhooks', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('webhooks', '❌ FALHA'); END IF;

  -- 20. SLA
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_company_sla') THEN
    v_results := v_results || jsonb_build_object('sla', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('sla', '❌ FALHA'); END IF;

  -- 21. Grupos Econômicos
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_economic_group_view') THEN
    v_results := v_results || jsonb_build_object('grupos_economicos', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('grupos_economicos', '❌ FALHA'); END IF;

  -- 22. Templates
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'apply_template') THEN
    v_results := v_results || jsonb_build_object('templates', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('templates', '❌ FALHA'); END IF;

  -- 23. Sentimento
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_classify_sentiment') THEN
    v_results := v_results || jsonb_build_object('sentimento', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('sentimento', '❌ FALHA'); END IF;

  -- 24. Calendário
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_calendar_event') THEN
    v_results := v_results || jsonb_build_object('calendario', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('calendario', '❌ FALHA'); END IF;

  -- 25. Benchmarks
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_seller_benchmark') THEN
    v_results := v_results || jsonb_build_object('benchmarks', '✅ OK'); v_score := v_score + 1;
  ELSE v_results := v_results || jsonb_build_object('benchmarks', '❌ FALHA'); END IF;

  RETURN jsonb_build_object(
    'score', v_score || '/' || v_max_score,
    'status', CASE 
      WHEN v_score = v_max_score THEN '🏆 PERFEITO'
      WHEN v_score >= v_max_score * 0.8 THEN '✅ BOM'
      ELSE '⚠️ INCOMPLETO'
    END,
    'modulos', v_results,
    'total_funcoes', (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f'),
    'total_tabelas', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
    'validado_em', NOW()
  );
END;
$function$
