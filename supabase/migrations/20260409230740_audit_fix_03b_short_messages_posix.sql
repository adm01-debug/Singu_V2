-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409230740
-- nome:   audit_fix_03b_short_messages_posix

CREATE OR REPLACE FUNCTION zapp_history.trg_short_message_auto_process()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp AS $fn$
DECLARE
  v_trimmed TEXT;
  v_alnum_count INT;
BEGIN
  v_trimmed := trim(COALESCE(NEW.content, ''));
  -- Conta caracteres alfanuméricos (letras/números em qualquer script)
  v_alnum_count := length(regexp_replace(v_trimmed, '[^[:alnum:]]', '', 'g'));

  -- Se não tem conteúdo real (menos de 3 caracteres alfanuméricos), auto-processa
  IF v_alnum_count < 3 THEN
    NEW.nlp_processed_at := NOW();
    NEW.nlp_sentiment := 'neutral';
    NEW.lead_score := COALESCE(NEW.lead_score, 0);
    NEW.primary_intent := CASE
      WHEN lower(v_trimmed) ~ '^(oi|ola|hi|hey|eae|opa|bom dia|boa tarde|boa noite)$' THEN 'saudacao'
      WHEN lower(v_trimmed) ~ '^(ok|okey|blz|beleza|certo|sim|nao|não|vlw|valeu)$' THEN 'confirmacao'
      ELSE 'mensagem_curta'
    END;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_short_msg_auto_process ON zapp_history.messages;
CREATE TRIGGER trg_short_msg_auto_process
  BEFORE INSERT ON zapp_history.messages
  FOR EACH ROW EXECUTE FUNCTION zapp_history.trg_short_message_auto_process();

ALTER TABLE zapp_history.messages DROP CONSTRAINT IF EXISTS chk_content_or_media;
ALTER TABLE zapp_history.messages ADD CONSTRAINT chk_content_or_media CHECK (
  content IS NOT NULL
  OR message_type IN ('audio','image','video','document','sticker','location','contact')
);

-- Backfill órfãs
UPDATE zapp_history.messages
SET nlp_processed_at = NOW(),
    nlp_sentiment = 'neutral',
    primary_intent = COALESCE(primary_intent, 'mensagem_curta')
WHERE nlp_request_id IS NULL
  AND nlp_processed_at IS NULL
  AND length(regexp_replace(trim(COALESCE(content,'')), '[^[:alnum:]]', '', 'g')) < 3;

SELECT COUNT(*) FROM zapp_history.messages WHERE nlp_processed_at IS NULL;
