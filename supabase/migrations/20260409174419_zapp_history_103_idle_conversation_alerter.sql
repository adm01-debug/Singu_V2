-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409174419
-- nome:   zapp_history_103_idle_conversation_alerter

-- View que mostra conversas com inbound mais recente que outbound (cliente esperando resposta)
CREATE OR REPLACE VIEW zapp_history.v_conversas_aguardando AS
SELECT
  c.id AS conversation_id,
  c.contact_id,
  ct.full_name AS contato,
  c.remote_jid AS whatsapp,
  c.last_message_at AS ultima_msg,
  EXTRACT(EPOCH FROM (NOW() - c.last_message_at))::INT AS aguardando_seg,
  EXTRACT(EPOCH FROM (NOW() - c.last_message_at))::INT / 60 AS aguardando_min,
  c.unread_count,
  c.last_message_preview AS preview,
  -- pega max lead_score das mensagens da conversa
  (SELECT MAX(lead_score) FROM zapp_history.messages WHERE conversation_id = c.id) AS max_lead_score,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - c.last_message_at)) <= 1800 THEN '🟢 ok'
    WHEN EXTRACT(EPOCH FROM (NOW() - c.last_message_at)) <= 3600 THEN '🟡 atencao'
    WHEN EXTRACT(EPOCH FROM (NOW() - c.last_message_at)) <= 14400 THEN '🟠 atrasado'
    ELSE '🔴 critico'
  END AS criticidade
FROM zapp_history.conversations c
JOIN public.contacts ct ON ct.id = c.contact_id
WHERE c.status = 'open'
  AND c.unread_count > 0
  AND EXISTS (
    SELECT 1 FROM zapp_history.messages m
    WHERE m.conversation_id = c.id
      AND m.direction = 'inbound'
      AND m.created_at = c.last_message_at
  )
ORDER BY max_lead_score DESC NULLS LAST, c.last_message_at ASC;

GRANT SELECT ON zapp_history.v_conversas_aguardando TO authenticated;

-- Função para buscar conversas críticas hot que precisam de atendimento urgente
CREATE OR REPLACE FUNCTION zapp_history.get_priority_queue(p_limit INT DEFAULT 20)
RETURNS TABLE (
  conversation_id UUID,
  contato TEXT,
  whatsapp TEXT,
  aguardando_min INT,
  max_lead_score INT,
  criticidade TEXT,
  preview TEXT
)
LANGUAGE sql STABLE
AS $fn$
  SELECT
    conversation_id, contato, whatsapp, aguardando_min::INT, max_lead_score, criticidade, preview
  FROM zapp_history.v_conversas_aguardando
  ORDER BY
    CASE
      WHEN max_lead_score >= 80 THEN 1
      WHEN max_lead_score >= 60 THEN 2
      WHEN max_lead_score >= 40 THEN 3
      ELSE 4
    END,
    aguardando_min DESC
  LIMIT p_limit;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.get_priority_queue(INT) TO authenticated, service_role;
