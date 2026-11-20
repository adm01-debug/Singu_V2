-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409221006
-- nome:   zapp_history_188_language_spam_views

CREATE OR REPLACE VIEW zapp_history.v_language_distribution AS
SELECT
  language_info->>'lang' AS idioma,
  language_info->>'dialect' AS dialeto,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS score_medio
FROM zapp_history.messages
WHERE language_info IS NOT NULL
GROUP BY language_info->>'lang', language_info->>'dialect'
ORDER BY total_mensagens DESC;

GRANT SELECT ON zapp_history.v_language_distribution TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_hesitation_funnel AS
SELECT
  hesitation->>'level' AS nivel_hesitacao,
  COUNT(*) AS total,
  COUNT(DISTINCT contact_id) AS contatos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas
FROM zapp_history.messages
WHERE hesitation IS NOT NULL
GROUP BY hesitation->>'level'
ORDER BY
  CASE hesitation->>'level'
    WHEN 'alta' THEN 1 WHEN 'media' THEN 2 WHEN 'baixa' THEN 3 ELSE 4
  END;

GRANT SELECT ON zapp_history.v_hesitation_funnel TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_spam_log AS
SELECT
  m.id,
  m.created_at,
  m.content AS mensagem,
  c.remote_jid AS whatsapp,
  m.credibility->>'level' AS nivel,
  (m.credibility->>'score')::INT AS score,
  m.credibility->'flags' AS flags,
  m.quarantined,
  m.quarantine_reason
FROM zapp_history.messages m
JOIN zapp_history.conversations c ON c.id = m.conversation_id
WHERE m.credibility->>'level' IN ('baixa','critica_spam')
ORDER BY m.created_at DESC;

GRANT SELECT ON zapp_history.v_spam_log TO authenticated;
