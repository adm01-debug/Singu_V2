-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409231631
-- nome:   zapp_history_audit_fix_8_check_constraints

-- Primeiro: normalizar mensagem vazia pra não quebrar constraint
UPDATE zapp_history.messages
SET content = '[mensagem vazia]'
WHERE message_type = 'text' AND (content IS NULL OR length(trim(content)) = 0);

-- CHECK 1: mensagem text precisa ter content não-vazio
ALTER TABLE zapp_history.messages
  ADD CONSTRAINT chk_text_has_content
  CHECK (message_type <> 'text' OR (content IS NOT NULL AND length(content) > 0));

-- CHECK 2: direction válida
ALTER TABLE zapp_history.messages
  ADD CONSTRAINT chk_direction_valid
  CHECK (direction IN ('inbound','outbound'));

-- CHECK 3: lead_score 0-100
ALTER TABLE zapp_history.messages
  ADD CONSTRAINT chk_lead_score_range
  CHECK (lead_score IS NULL OR (lead_score >= 0 AND lead_score <= 100));

-- CHECK 4: nlp_sentiment_score -1 a 1
ALTER TABLE zapp_history.messages
  ADD CONSTRAINT chk_sentiment_score_range
  CHECK (nlp_sentiment_score IS NULL OR (nlp_sentiment_score >= -1 AND nlp_sentiment_score <= 1));

-- CHECK 5: conversations status válido
ALTER TABLE zapp_history.conversations
  ADD CONSTRAINT chk_conv_status_valid
  CHECK (status IN ('open','pending','resolved','archived','closed'));

-- CHECK 6: whatsapp_connections status válido
ALTER TABLE zapp_history.whatsapp_connections
  ADD CONSTRAINT chk_wc_status_valid
  CHECK (status IN ('connected','disconnected','connecting','error'));
