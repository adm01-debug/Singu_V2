-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409135753
-- nome:   zapp_history_57_view_pedidos_detectados

-- ============================================================================
-- MELHORIA 57: View pra você ver TODOS os pedidos detectados automaticamente
-- pelo NLP, ranqueados por urgência e novidade
-- ============================================================================

CREATE OR REPLACE VIEW zapp_history.v_pedidos_detectados AS
SELECT
  m.id AS message_id,
  m.created_at AS recebido_em,
  c.full_name AS contato,
  c.id AS contact_id,
  comp.razao_social AS empresa,
  m.content AS mensagem_original,
  m.nlp_sentiment AS urgencia,
  m.nlp_sentiment_score AS confianca,
  m.nlp_structured_order->>'product' AS produto,
  (m.nlp_structured_order->>'quantity')::INT AS quantidade,
  m.nlp_structured_order->>'deadline' AS prazo,
  m.nlp_structured_order->>'cnpj' AS cnpj,
  m.nlp_entities AS entidades_completas,
  m.raw_payload->>'singu_interaction_id' AS singu_interaction_id,
  conv.remote_jid AS whatsapp,
  CASE
    WHEN m.nlp_sentiment = 'urgent' THEN 1
    WHEN m.nlp_sentiment IN ('positive','interested') THEN 2
    WHEN m.nlp_sentiment = 'neutral' THEN 3
    ELSE 4
  END AS prioridade
FROM zapp_history.messages m
JOIN public.contacts c ON c.id = m.contact_id
LEFT JOIN public.companies comp ON comp.id = m.company_id
JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
WHERE m.nlp_structured_order IS NOT NULL
  AND m.nlp_structured_order <> '{}'::jsonb
  AND m.nlp_structured_order ? 'product'
ORDER BY prioridade ASC, m.created_at DESC;

GRANT SELECT ON zapp_history.v_pedidos_detectados TO authenticated;

COMMENT ON VIEW zapp_history.v_pedidos_detectados IS
  'Pedidos extraídos automaticamente pelo NLP de mensagens WhatsApp. Ordenado por prioridade (urgent primeiro) e data.';
