-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409225140
-- nome:   zapp_history_215_new_views

CREATE OR REPLACE VIEW zapp_history.v_units_distribution AS
SELECT unit_of_measure AS unidade, COUNT(*) AS total, AVG((nlp_structured_order->>'quantity')::INT)::INT AS qty_media
FROM zapp_history.messages
WHERE unit_of_measure IS NOT NULL
GROUP BY unit_of_measure
ORDER BY total DESC;
GRANT SELECT ON zapp_history.v_units_distribution TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_delivery_distribution AS
SELECT
  delivery_preference->>'method' AS metodo,
  delivery_preference->>'urgency' AS urgencia,
  COUNT(*) AS total,
  AVG(lead_score)::numeric(5,2) AS score_medio
FROM zapp_history.messages
WHERE delivery_preference IS NOT NULL
GROUP BY delivery_preference->>'method', delivery_preference->>'urgency'
ORDER BY total DESC;
GRANT SELECT ON zapp_history.v_delivery_distribution TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_referral_sources AS
SELECT
  referral_source->>'source' AS fonte,
  COUNT(*) AS total,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS fechou
FROM zapp_history.messages
WHERE referral_source IS NOT NULL
GROUP BY referral_source->>'source'
ORDER BY total DESC;
GRANT SELECT ON zapp_history.v_referral_sources TO authenticated;
