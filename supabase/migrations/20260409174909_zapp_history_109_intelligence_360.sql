-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409174909
-- nome:   zapp_history_109_intelligence_360

-- View master que consolida TUDO que o pipeline sabe sobre cada mensagem
-- Ideal para o front-end consumir via PostgREST
CREATE OR REPLACE VIEW zapp_history.v_intelligence_360 AS
SELECT
  m.id AS message_id,
  m.created_at AS recebido_em,
  m.direction,
  m.in_business_hours,
  m.day_of_week,
  EXTRACT(HOUR FROM (m.created_at AT TIME ZONE 'America/Sao_Paulo'))::INT AS hora_local,

  -- Contato
  ct.id AS contact_id,
  ct.full_name AS contato,
  ct.tags_array AS contato_tags,

  -- Empresa
  comp.id AS company_id,
  comp.razao_social AS empresa,
  comp.cnpj AS empresa_cnpj,

  -- Conversa
  conv.id AS conversation_id,
  conv.remote_jid AS whatsapp,
  conv.first_response_seconds AS primeira_resposta_seg,
  conv.sla_status,
  conv.unread_count,
  conv.last_message_at,

  -- Mensagem
  LEFT(m.content, 500) AS mensagem,
  m.message_type,

  -- NLP básico
  m.nlp_sentiment AS sentimento,
  m.nlp_sentiment_score AS confianca_sentimento,
  m.nlp_entities AS entidades,

  -- Pedido estruturado
  m.nlp_structured_order AS pedido_completo,
  m.nlp_structured_order->>'product' AS produto,
  (m.nlp_structured_order->>'quantity')::INT AS quantidade,
  m.nlp_structured_order->>'deadline' AS prazo,
  m.nlp_structured_order->>'cnpj' AS cnpj_mencionado,

  -- Análise avançada
  m.budget_detected AS budget,
  m.discovery_channel AS canal_descoberta,
  m.objections AS objeções,
  m.funnel_stage AS etapa_funil,

  -- Scoring
  m.lead_score,
  m.lead_score_breakdown,
  CASE
    WHEN m.lead_score >= 80 THEN '🔥 HOT'
    WHEN m.lead_score >= 60 THEN '🌶️ WARM'
    WHEN m.lead_score >= 40 THEN '💧 LUKEWARM'
    WHEN m.lead_score IS NULL THEN '❓ SEM SCORE'
    ELSE '❄️ COLD'
  END AS classificacao,

  CASE
    WHEN m.lead_score >= 80 THEN 1
    WHEN m.lead_score >= 60 THEN 2
    WHEN m.lead_score >= 40 THEN 3
    ELSE 4
  END AS prioridade,

  -- Ações recomendadas (insights automáticos)
  CASE
    WHEN m.nlp_sentiment = 'urgent' AND m.lead_score >= 80 THEN '🚨 ATENDER AGORA - lead quente urgente'
    WHEN m.nlp_sentiment = 'urgent' THEN '⚡ Urgente - priorizar na fila'
    WHEN m.lead_score >= 80 AND m.funnel_stage IN ('proposta','negociacao') THEN '💰 Fechar proposta - lead quente em negociação'
    WHEN m.funnel_stage = 'fechamento' THEN '✅ Confirmar fechamento - enviar boleto/pix'
    WHEN m.funnel_stage = 'negociacao' AND 'preco_alto' = ANY(m.objections) THEN '🎯 Oferecer desconto ou parcelamento'
    WHEN m.funnel_stage = 'negociacao' AND 'concorrencia' = ANY(m.objections) THEN '🏆 Destacar diferenciais vs concorrente'
    WHEN 'aprovacao_interna' = ANY(m.objections) THEN '📋 Preparar material pro decisor interno'
    WHEN 'forma_pagamento' = ANY(m.objections) THEN '💳 Enviar condições de pagamento'
    WHEN 'indecisao' = ANY(m.objections) THEN '🎣 Criar senso de urgência / follow-up em 2 dias'
    WHEN m.discovery_channel = 'cliente_recorrente' THEN '♻️ Cliente recorrente - agilizar cotação'
    WHEN m.discovery_channel = 'indicacao' THEN '🤝 Indicação - atenção especial'
    WHEN m.funnel_stage = 'descoberta' THEN '👋 Qualificar lead - perguntar produto e volume'
    WHEN m.funnel_stage = 'interesse' THEN '📝 Enviar catálogo e pedir briefing'
    WHEN m.funnel_stage = 'cotacao' THEN '💼 Preparar proposta formal'
    ELSE '📬 Responder em tempo hábil'
  END AS acao_recomendada,

  -- Bridge SINGU
  m.raw_payload->>'singu_interaction_id' AS singu_interaction_id

FROM zapp_history.messages m
JOIN public.contacts ct ON ct.id = m.contact_id
JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
LEFT JOIN public.companies comp ON comp.id = m.company_id
WHERE m.nlp_processed_at IS NOT NULL
ORDER BY m.lead_score DESC NULLS LAST, m.created_at DESC;

GRANT SELECT ON zapp_history.v_intelligence_360 TO authenticated;

COMMENT ON VIEW zapp_history.v_intelligence_360 IS
'View master consolidada. Retorna TUDO que o pipeline sabe sobre cada mensagem + ação recomendada automática. Use no front-end como única fonte de verdade.';
