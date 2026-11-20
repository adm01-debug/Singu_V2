-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409205351
-- nome:   zapp_history_145_disc_payment_custom_views

CREATE OR REPLACE VIEW zapp_history.v_disc_distribution AS
SELECT
  disc_profile->>'dominant' AS perfil,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  AVG(budget_detected)::numeric(12,2) AS budget_medio,
  COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS fecharam,
  CASE disc_profile->>'dominant'
    WHEN 'D' THEN 'Direto e objetivo. Foco em resultado, ROI, prazo. Sem enrolação.'
    WHEN 'I' THEN 'Caloroso e entusiasmado. Use storytelling, mostre cases.'
    WHEN 'S' THEN 'Paciente e cordial. Construa relação, dê garantias.'
    WHEN 'C' THEN 'Técnico e detalhado. Mande ficha, especificações.'
  END AS abordagem_recomendada
FROM zapp_history.messages
WHERE disc_profile IS NOT NULL AND (disc_profile->>'dominant') IS NOT NULL
GROUP BY disc_profile->>'dominant'
ORDER BY total_mensagens DESC;

GRANT SELECT ON zapp_history.v_disc_distribution TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_payment_preferences AS
SELECT
  unnest(payment_preferences) AS forma_pagamento,
  COUNT(*) AS total_ocorrencias,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  AVG(budget_detected)::numeric(12,2) AS ticket_medio
FROM zapp_history.messages
WHERE payment_preferences IS NOT NULL AND array_length(payment_preferences, 1) > 0
GROUP BY unnest(payment_preferences)
ORDER BY total_ocorrencias DESC;

GRANT SELECT ON zapp_history.v_payment_preferences TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_customization_demand AS
WITH expanded AS (
  SELECT
    id,
    contact_id,
    lead_score,
    jsonb_array_elements_text(COALESCE(customization_extracted->'colors', '[]'::jsonb)) AS color,
    NULL::TEXT AS material,
    NULL::TEXT AS technique
  FROM zapp_history.messages WHERE customization_extracted IS NOT NULL
  UNION ALL
  SELECT id, contact_id, lead_score, NULL, jsonb_array_elements_text(COALESCE(customization_extracted->'materials', '[]'::jsonb)), NULL
  FROM zapp_history.messages WHERE customization_extracted IS NOT NULL
  UNION ALL
  SELECT id, contact_id, lead_score, NULL, NULL, jsonb_array_elements_text(COALESCE(customization_extracted->'techniques', '[]'::jsonb))
  FROM zapp_history.messages WHERE customization_extracted IS NOT NULL
)
SELECT
  COALESCE(color, material, technique) AS atributo,
  CASE WHEN color IS NOT NULL THEN 'cor' WHEN material IS NOT NULL THEN 'material' ELSE 'tecnica' END AS categoria,
  COUNT(*) AS total_pedidos,
  COUNT(DISTINCT contact_id) AS contatos
FROM expanded
WHERE COALESCE(color, material, technique) IS NOT NULL
GROUP BY atributo, categoria
ORDER BY total_pedidos DESC;

GRANT SELECT ON zapp_history.v_customization_demand TO authenticated;
