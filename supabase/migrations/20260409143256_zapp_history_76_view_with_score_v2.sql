-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409143256
-- nome:   zapp_history_76_view_with_score_v2

DROP VIEW IF EXISTS zapp_history.v_pedidos_detectados CASCADE;

CREATE VIEW zapp_history.v_pedidos_detectados AS
SELECT
  m.id AS message_id,
  m.created_at AS recebido_em,
  c.full_name AS contato,
  c.id AS contact_id,
  comp.razao_social AS empresa,
  m.content AS mensagem_original,
  m.nlp_sentiment AS urgencia,
  m.nlp_sentiment_score AS confianca,
  m.lead_score,
  m.lead_score_breakdown,
  m.nlp_structured_order->>'product' AS produto,
  (m.nlp_structured_order->>'quantity')::INT AS quantidade,
  m.nlp_structured_order->>'deadline' AS prazo,
  m.nlp_structured_order->>'cnpj' AS cnpj,
  m.nlp_entities AS entidades_completas,
  m.raw_payload->>'singu_interaction_id' AS singu_interaction_id,
  conv.remote_jid AS whatsapp,
  CASE
    WHEN m.lead_score >= 80 THEN 1
    WHEN m.lead_score >= 60 THEN 2
    WHEN m.lead_score >= 40 THEN 3
    ELSE 4
  END AS prioridade,
  CASE
    WHEN m.lead_score >= 80 THEN '🔥 HOT'
    WHEN m.lead_score >= 60 THEN '🌶️ WARM'
    WHEN m.lead_score >= 40 THEN '💧 LUKEWARM'
    ELSE '❄️ COLD'
  END AS classificacao
FROM zapp_history.messages m
JOIN public.contacts c ON c.id = m.contact_id
LEFT JOIN public.companies comp ON comp.id = m.company_id
JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
WHERE m.nlp_structured_order IS NOT NULL
  AND m.nlp_structured_order <> '{}'::jsonb
  AND m.nlp_structured_order ? 'product'
ORDER BY m.lead_score DESC NULLS LAST, m.created_at DESC;

GRANT SELECT ON zapp_history.v_pedidos_detectados TO authenticated;
