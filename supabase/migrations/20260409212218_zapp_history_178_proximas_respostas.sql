-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409212218
-- nome:   zapp_history_178_proximas_respostas

CREATE OR REPLACE VIEW zapp_history.v_proximas_respostas AS
SELECT
  m.id AS message_id,
  m.created_at AS recebido_em,
  m.suggested_response_at AS responder_ate,
  m.suggested_response_label AS prazo_label,
  EXTRACT(EPOCH FROM (m.suggested_response_at - NOW()))/60 AS minutos_restantes,
  ct.full_name AS contato,
  conv.remote_jid AS whatsapp,
  m.lead_score,
  m.priority_quadrant,
  m.nlp_sentiment AS sentimento,
  m.churn_risk->>'risk' AS churn,
  LEFT(m.content, 150) AS preview,
  CASE
    WHEN m.suggested_response_at < NOW() THEN '🚨 ATRASADO'
    WHEN m.suggested_response_at < NOW() + INTERVAL '15 minutes' THEN '⏰ EM 15 MIN'
    WHEN m.suggested_response_at < NOW() + INTERVAL '1 hour' THEN '⏳ EM 1H'
    ELSE '📅 NO PRAZO'
  END AS status_resposta
FROM zapp_history.messages m
JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
JOIN public.contacts ct ON ct.id = m.contact_id
WHERE m.suggested_response_at IS NOT NULL
  AND m.direction = 'inbound'
  -- Só mostra se a conversa ainda não foi respondida (unread > 0)
  AND conv.unread_count > 0
ORDER BY m.suggested_response_at ASC;

GRANT SELECT ON zapp_history.v_proximas_respostas TO authenticated;
