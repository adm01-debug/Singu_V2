-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409205720
-- nome:   zapp_history_144_disc_journey_views_v2

DROP VIEW IF EXISTS zapp_history.v_disc_distribution CASCADE;

CREATE VIEW zapp_history.v_disc_distribution AS
SELECT
  disc_profile->>'profile' AS perfil,
  disc_profile->>'description' AS descricao,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
  AVG(budget_detected)::numeric(12,2) AS ticket_medio,
  array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas_observadas
FROM zapp_history.messages
WHERE disc_profile IS NOT NULL
GROUP BY disc_profile->>'profile', disc_profile->>'description'
ORDER BY total_mensagens DESC;

GRANT SELECT ON zapp_history.v_disc_distribution TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_journey_funnel AS
WITH stages AS (
  SELECT 'TOFU' AS stage, 1 AS ordem, 'Topo - descobrindo' AS jdesc UNION ALL
  SELECT 'MOFU', 2, 'Meio - comparando' UNION ALL
  SELECT 'BOFU', 3, 'Fundo - pronto pra comprar'
)
SELECT
  s.stage AS etapa,
  s.ordem,
  s.jdesc AS descricao,
  COUNT(m.id) AS total_mensagens,
  COUNT(DISTINCT m.contact_id) AS contatos_unicos,
  AVG(m.lead_score)::numeric(5,2) AS score_medio,
  SUM(m.budget_detected)::numeric(14,2) AS budget_total,
  COUNT(*) FILTER (WHERE m.lead_score >= 80) AS leads_hot
FROM stages s
LEFT JOIN zapp_history.messages m ON m.journey_stage = s.stage
GROUP BY s.stage, s.ordem, s.jdesc
ORDER BY s.ordem;

GRANT SELECT ON zapp_history.v_journey_funnel TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_disc_funnel_matrix AS
SELECT
  disc_profile->>'profile' AS perfil_disc,
  funnel_stage AS etapa_funil,
  COUNT(*) AS total,
  AVG(lead_score)::numeric(5,2) AS score_medio
FROM zapp_history.messages
WHERE disc_profile IS NOT NULL AND funnel_stage IS NOT NULL
GROUP BY disc_profile->>'profile', funnel_stage
ORDER BY perfil_disc, etapa_funil;

GRANT SELECT ON zapp_history.v_disc_funnel_matrix TO authenticated;
