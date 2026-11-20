-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409211312
-- nome:   zapp_history_164_speaker_complexity_views

CREATE OR REPLACE VIEW zapp_history.v_speaker_roles AS
SELECT
  speaker_role AS papel,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
  AVG(budget_detected)::numeric(12,2) AS ticket_medio,
  COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS fechou
FROM zapp_history.messages
WHERE speaker_role IS NOT NULL
GROUP BY speaker_role
ORDER BY leads_hot DESC, total_mensagens DESC;

GRANT SELECT ON zapp_history.v_speaker_roles TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_complexity_distribution AS
SELECT
  order_complexity->>'level' AS complexidade,
  COUNT(*) AS total_pedidos,
  AVG((order_complexity->>'score')::INT)::numeric(5,2) AS score_complex_medio,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  AVG((nlp_structured_order->>'quantity')::INT)::INT AS qty_media,
  AVG(budget_detected)::numeric(12,2) AS ticket_medio
FROM zapp_history.messages
WHERE order_complexity IS NOT NULL
GROUP BY order_complexity->>'level'
ORDER BY
  CASE order_complexity->>'level'
    WHEN 'simples' THEN 1 WHEN 'medio' THEN 2 WHEN 'complexo' THEN 3
  END;

GRANT SELECT ON zapp_history.v_complexity_distribution TO authenticated;
