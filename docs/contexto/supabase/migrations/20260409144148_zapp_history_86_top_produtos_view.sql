CREATE OR REPLACE VIEW zapp_history.v_top_produtos_demanda AS
SELECT
  m.nlp_structured_order->>'product' AS produto,
  pd.category AS categoria,
  COUNT(*) AS total_pedidos,
  COUNT(DISTINCT m.contact_id) AS clientes_unicos,
  SUM((m.nlp_structured_order->>'quantity')::INT) AS volume_total,
  AVG((m.nlp_structured_order->>'quantity')::INT)::INT AS quantidade_media,
  AVG(m.lead_score)::numeric(5,2) AS lead_score_medio,
  COUNT(*) FILTER (WHERE m.lead_score >= 80) AS leads_hot,
  COUNT(*) FILTER (WHERE m.nlp_sentiment = 'urgent') AS pedidos_urgentes,
  AVG(m.budget_detected)::numeric(12,2) AS ticket_medio_detectado,
  MIN(m.created_at) AS primeiro_pedido,
  MAX(m.created_at) AS ultimo_pedido
FROM zapp_history.messages m
LEFT JOIN zapp_history.product_dictionary pd
  ON pd.canonical_name = (m.nlp_structured_order->>'product')
WHERE m.nlp_structured_order ? 'product'
GROUP BY m.nlp_structured_order->>'product', pd.category
ORDER BY total_pedidos DESC, volume_total DESC NULLS LAST;

GRANT SELECT ON zapp_history.v_top_produtos_demanda TO authenticated;
