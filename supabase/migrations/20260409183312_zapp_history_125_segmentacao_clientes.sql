-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409183312
-- nome:   zapp_history_125_segmentacao_clientes

CREATE OR REPLACE VIEW zapp_history.v_segmentacao_clientes AS
SELECT
  COALESCE(customer_type, 'indefinido') AS tipo_cliente,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
  AVG((nlp_structured_order->>'quantity')::INT)::INT AS qty_media,
  AVG(budget_detected)::numeric(12,2) AS budget_medio,
  SUM(budget_detected)::numeric(14,2) AS budget_total,
  COUNT(*) FILTER (WHERE nlp_sentiment = 'urgent') AS urgentes,
  array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas
FROM zapp_history.messages
WHERE nlp_processed_at IS NOT NULL
GROUP BY customer_type
ORDER BY leads_hot DESC, total_mensagens DESC;

GRANT SELECT ON zapp_history.v_segmentacao_clientes TO authenticated;

-- View de tipos de evento
CREATE OR REPLACE VIEW zapp_history.v_eventos_demanda AS
SELECT
  event_type AS tipo_evento,
  COUNT(*) AS total_pedidos,
  COUNT(DISTINCT contact_id) AS contatos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  AVG((nlp_structured_order->>'quantity')::INT)::INT AS qty_media,
  SUM(budget_detected)::numeric(14,2) AS budget_total,
  array_agg(DISTINCT nlp_structured_order->>'product') FILTER (WHERE nlp_structured_order->>'product' IS NOT NULL) AS produtos_pedidos
FROM zapp_history.messages
WHERE event_type IS NOT NULL
GROUP BY event_type
ORDER BY total_pedidos DESC;

GRANT SELECT ON zapp_history.v_eventos_demanda TO authenticated;

-- View de tons de comunicação
CREATE OR REPLACE VIEW zapp_history.v_tom_comunicacao AS
SELECT
  communication_tone->>'tone' AS tom,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  AVG((communication_tone->>'emoji_count')::INT)::numeric(5,2) AS emojis_medios,
  AVG((communication_tone->>'word_count')::INT)::numeric(5,1) AS palavras_medias,
  COUNT(*) FILTER (WHERE (communication_tone->>'is_screaming')::BOOLEAN) AS gritando_caps
FROM zapp_history.messages
WHERE communication_tone IS NOT NULL AND communication_tone->>'tone' <> 'indefinido'
GROUP BY communication_tone->>'tone'
ORDER BY total_mensagens DESC;

GRANT SELECT ON zapp_history.v_tom_comunicacao TO authenticated;
