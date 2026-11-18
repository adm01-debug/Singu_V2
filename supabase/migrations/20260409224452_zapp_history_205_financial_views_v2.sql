-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409224452
-- nome:   zapp_history_205_financial_views_v2

DROP VIEW IF EXISTS zapp_history.v_payment_preferences CASCADE;

CREATE VIEW zapp_history.v_budget_sensitivity AS
SELECT
  budget_sensitivity->>'sensitivity' AS sensibilidade,
  COUNT(*) AS total,
  COUNT(DISTINCT contact_id) AS contatos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  AVG(budget_detected)::numeric(14,2) AS ticket_medio,
  COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS fechou
FROM zapp_history.messages
WHERE budget_sensitivity IS NOT NULL
GROUP BY budget_sensitivity->>'sensitivity'
ORDER BY
  CASE budget_sensitivity->>'sensitivity'
    WHEN 'baixa' THEN 1 WHEN 'media' THEN 2 WHEN 'alta' THEN 3
  END;

GRANT SELECT ON zapp_history.v_budget_sensitivity TO authenticated;

CREATE VIEW zapp_history.v_payment_preferences AS
SELECT
  unnest(payment_preferences) AS forma_pagamento,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  SUM(budget_detected)::numeric(14,2) AS valor_total_mencionado
FROM zapp_history.messages
WHERE payment_preferences IS NOT NULL
GROUP BY unnest(payment_preferences)
ORDER BY total_mensagens DESC;

GRANT SELECT ON zapp_history.v_payment_preferences TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_competitor_alerts AS
SELECT
  m.id AS message_id,
  m.created_at,
  ct.full_name AS contato,
  comp.razao_social AS empresa,
  m.competitor_mention->>'context' AS contexto,
  m.competitor_mention->'flags' AS flags,
  m.lead_score,
  m.funnel_stage,
  LEFT(m.content, 200) AS preview,
  CASE m.competitor_mention->>'context'
    WHEN 'pressao_preco' THEN '💰 Cliente pressionando por preço - oferecer condição especial ou justificar valor'
    WHEN 'questiona_diferencial' THEN '🎯 Cliente comparando features - destacar diferenciais únicos'
    WHEN 'tem_fornecedor_atual' THEN '🔄 Cliente já tem fornecedor - trabalhar migração'
    ELSE '🔍 Cliente pesquisando mercado - educar sobre valor'
  END AS acao_sugerida
FROM zapp_history.messages m
JOIN public.contacts ct ON ct.id = m.contact_id
LEFT JOIN public.companies comp ON comp.id = m.company_id
WHERE m.competitor_mention IS NOT NULL
ORDER BY m.created_at DESC;

GRANT SELECT ON zapp_history.v_competitor_alerts TO authenticated;
