-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409205604
-- nome:   zapp_history_148_intelligence360_v3

DROP VIEW IF EXISTS zapp_history.v_intelligence_360 CASCADE;

CREATE VIEW zapp_history.v_intelligence_360 AS
SELECT
  m.id AS message_id,
  m.created_at AS recebido_em,
  m.direction,
  m.in_business_hours,
  m.day_of_week,
  EXTRACT(HOUR FROM (m.created_at AT TIME ZONE 'America/Sao_Paulo'))::INT AS hora_local,
  ct.id AS contact_id,
  ct.full_name AS contato,
  ct.tags_array AS contato_tags,
  comp.id AS company_id,
  comp.razao_social AS empresa,
  comp.cnpj AS empresa_cnpj,
  conv.id AS conversation_id,
  conv.remote_jid AS whatsapp,
  conv.first_response_seconds AS primeira_resposta_seg,
  conv.sla_status,
  conv.unread_count,
  LEFT(m.content, 500) AS mensagem,
  m.message_type,
  m.nlp_sentiment AS sentimento,
  m.nlp_sentiment_score AS confianca_sentimento,
  m.nlp_structured_order AS pedido_completo,
  m.nlp_structured_order->>'product' AS produto,
  (m.nlp_structured_order->>'quantity')::INT AS quantidade,
  m.nlp_structured_order->>'deadline' AS prazo,
  m.nlp_structured_order->>'cnpj' AS cnpj_mencionado,
  m.budget_detected AS budget,
  m.discovery_channel AS canal_descoberta,
  m.objections AS objecoes,
  m.funnel_stage AS etapa_funil,
  m.customer_type AS tipo_cliente,
  m.event_type AS tipo_evento,
  m.communication_tone->>'tone' AS tom,
  m.location_extracted->>'city' AS cidade,
  m.location_extracted->>'state' AS uf,
  m.contact_info_extracted AS contato_info,
  m.buying_triggers AS gatilhos_compra,
  m.churn_risk->>'risk' AS risco_churn,
  (m.churn_risk->>'score')::INT AS score_churn,
  -- NOVOS na 141-150
  m.disc_profile->>'dominant' AS perfil_disc,
  m.disc_profile->>'recommended_approach' AS abordagem_disc,
  m.payment_preferences,
  m.customization_extracted,
  m.lead_score,
  m.lead_score_breakdown,
  CASE
    WHEN (m.churn_risk->>'risk') IN ('alto','critico') THEN '⛔ CHURN'
    WHEN m.lead_score >= 80 THEN '🔥 HOT'
    WHEN m.lead_score >= 60 THEN '🌶️ WARM'
    WHEN m.lead_score >= 40 THEN '💧 LUKEWARM'
    WHEN m.lead_score IS NULL THEN '❓ SEM SCORE'
    ELSE '❄️ COLD'
  END AS classificacao,
  CASE
    WHEN (m.churn_risk->>'risk') = 'critico' THEN 0
    WHEN (m.churn_risk->>'risk') = 'alto' THEN 1
    WHEN m.lead_score >= 80 THEN 1
    WHEN m.lead_score >= 60 THEN 2
    WHEN m.lead_score >= 40 THEN 3
    ELSE 4
  END AS prioridade,
  CASE
    WHEN (m.churn_risk->>'risk') = 'critico' THEN '⛔ CHURN CRÍTICO - escalar para gerência IMEDIATAMENTE. Ligar agora.'
    WHEN (m.churn_risk->>'risk') = 'alto' THEN '⚠️ CHURN ALTO - resposta empática em < 15min. Pedir desculpas + solução concreta.'
    WHEN 'budget_aprovado' = ANY(m.buying_triggers) AND 'decisao_tomada' = ANY(m.buying_triggers) THEN '💰 LEAD QUENTÍSSIMO - cliente pronto pra fechar. Enviar proposta formal HOJE.'
    WHEN 'troca_fornecedor' = ANY(m.buying_triggers) THEN '🎯 CLIENTE EM TROCA - destacar diferenciais vs antigo fornecedor.'
    WHEN 'licitacao' = ANY(m.buying_triggers) THEN '📋 LICITAÇÃO - verificar prazos do edital, enviar documentação técnica.'
    WHEN 'recorrente' = ANY(m.buying_triggers) THEN '♻️ RECOMPRA - puxar histórico, agilizar pedido idêntico.'
    WHEN m.disc_profile->>'dominant' = 'D' THEN '🎯 PERFIL D - direto e objetivo. Mande proposta sem rodeios, foque em prazo e ROI.'
    WHEN m.disc_profile->>'dominant' = 'I' THEN '🎉 PERFIL I - caloroso. Use storytelling, mostre cases, fotos de eventos.'
    WHEN m.disc_profile->>'dominant' = 'S' THEN '🤝 PERFIL S - construa relação, dê garantias, evite pressão.'
    WHEN m.disc_profile->>'dominant' = 'C' THEN '📊 PERFIL C - mande ficha técnica, certificados, especificações detalhadas.'
    WHEN m.nlp_sentiment = 'urgent' AND m.lead_score >= 80 THEN '🚨 ATENDER AGORA - lead quente urgente'
    WHEN m.lead_score >= 80 AND m.funnel_stage IN ('proposta','negociacao') THEN '💰 Fechar proposta'
    WHEN m.funnel_stage = 'fechamento' THEN '✅ Confirmar fechamento - enviar boleto/pix'
    WHEN 'preco_alto' = ANY(m.objections) THEN '🎯 Oferecer desconto ou parcelamento'
    WHEN 'concorrencia' = ANY(m.objections) THEN '🏆 Destacar diferenciais vs concorrente'
    WHEN 'aprovacao_interna' = ANY(m.objections) THEN '📋 Preparar material pro decisor interno'
    WHEN 'forma_pagamento' = ANY(m.objections) THEN '💳 Enviar condições de pagamento'
    WHEN 'indecisao' = ANY(m.objections) THEN '🎣 Follow-up em 2 dias'
    WHEN m.customer_type = 'revendedor' THEN '🏪 REVENDEDOR - tabela atacado'
    WHEN m.customer_type = 'b2c' AND m.event_type IS NOT NULL THEN '🎉 B2C ' || m.event_type || ' - tom acolhedor'
    WHEN m.funnel_stage = 'descoberta' THEN '👋 Qualificar lead'
    WHEN m.funnel_stage = 'interesse' THEN '📝 Enviar catálogo'
    WHEN m.funnel_stage = 'cotacao' THEN '💼 Preparar proposta'
    ELSE '📬 Responder em tempo hábil'
  END AS acao_recomendada,
  m.raw_payload->>'singu_interaction_id' AS singu_interaction_id
FROM zapp_history.messages m
JOIN public.contacts ct ON ct.id = m.contact_id
JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
LEFT JOIN public.companies comp ON comp.id = m.company_id
WHERE m.nlp_processed_at IS NOT NULL
ORDER BY
  CASE WHEN (m.churn_risk->>'risk') = 'critico' THEN 0 ELSE 1 END,
  m.lead_score DESC NULLS LAST,
  m.created_at DESC;

GRANT SELECT ON zapp_history.v_intelligence_360 TO authenticated;

-- Recria master_dashboard
CREATE OR REPLACE FUNCTION zapp_history.master_dashboard()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'generated_at', NOW(),
    'pipeline_status', zapp_history.health_check()->'overall_status',
    'kpis_hoje', (SELECT to_jsonb(d.*) FROM zapp_history.v_dashboard_atendimento d),
    'fila_prioridade', (SELECT COALESCE(jsonb_agg(q.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.get_priority_queue(10)) q),
    'top_leads_24h', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'message_id', message_id, 'contato', contato, 'empresa', empresa,
        'produto', produto, 'quantidade', quantidade, 'budget', budget,
        'classificacao', classificacao, 'lead_score', lead_score,
        'etapa_funil', etapa_funil, 'perfil_disc', perfil_disc,
        'acao_recomendada', acao_recomendada, 'recebido_em', recebido_em
      )), '[]'::jsonb)
      FROM (SELECT * FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t
    ),
    'churn_alerts', (SELECT COALESCE(jsonb_agg(c.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_churn_alerts LIMIT 10) c),
    'buying_triggers', (SELECT COALESCE(jsonb_agg(b.*), '[]'::jsonb) FROM zapp_history.v_buying_triggers b),
    'disc_distribution', (SELECT COALESCE(jsonb_agg(d.*), '[]'::jsonb) FROM zapp_history.v_disc_distribution d),
    'payment_preferences', (SELECT COALESCE(jsonb_agg(p.*), '[]'::jsonb) FROM zapp_history.v_payment_preferences p),
    'customization_demand', (SELECT COALESCE(jsonb_agg(c.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_customization_demand LIMIT 20) c),
    'funil_vendas', (SELECT COALESCE(jsonb_agg(f.*), '[]'::jsonb) FROM zapp_history.v_funil_vendas f),
    'funil_origem', (SELECT COALESCE(jsonb_agg(fo.*), '[]'::jsonb) FROM zapp_history.v_funil_origem fo),
    'top_produtos', (SELECT COALESCE(jsonb_agg(tp.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp),
    'top_objecoes', (SELECT COALESCE(jsonb_agg(o.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o),
    'sla', (SELECT COALESCE(jsonb_agg(s.*), '[]'::jsonb) FROM zapp_history.v_sla_atendimento s),
    'top_contatos_valor', (SELECT COALESCE(jsonb_agg(tc.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc),
    'demanda_geografica', (SELECT COALESCE(jsonb_agg(g.*), '[]'::jsonb) FROM zapp_history.v_demanda_geografica g),
    'top_cidades', (SELECT COALESCE(jsonb_agg(c.*), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c),
    'segmentacao_clientes', (SELECT COALESCE(jsonb_agg(s.*), '[]'::jsonb) FROM zapp_history.v_segmentacao_clientes s),
    'eventos_demanda', (SELECT COALESCE(jsonb_agg(e.*), '[]'::jsonb) FROM zapp_history.v_eventos_demanda e),
    'tom_comunicacao', (SELECT COALESCE(jsonb_agg(t.*), '[]'::jsonb) FROM zapp_history.v_tom_comunicacao t),
    'alertas_urgentes', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'entity_id', entity_id, 'request_kind', request_kind,
        'payload_preview', payload_preview, 'triggered_at', triggered_at
      )), '[]'::jsonb)
      FROM zapp_history.async_request_log
      WHERE status IN ('urgent_pending_notification','churn_pending_action')
        AND triggered_at > NOW() - INTERVAL '24 hours'
      LIMIT 30
    )
  ) INTO v_result;
  RETURN v_result;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.master_dashboard() TO authenticated, service_role;
