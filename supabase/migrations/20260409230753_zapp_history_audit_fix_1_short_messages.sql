-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409230753
-- nome:   zapp_history_audit_fix_1_short_messages

-- Fix: mensagens curtas são processadas localmente sem chamar NLP remoto
CREATE OR REPLACE FUNCTION zapp_history.trg_auto_request_embedding()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
DECLARE
  v_req_id BIGINT;
  v_intent TEXT;
BEGIN
  -- Ignora não-texto e nulls
  IF NEW.message_type <> 'text' OR NEW.content IS NULL THEN
    RETURN NEW;
  END IF;

  -- Mensagens vazias/muito curtas: processa LOCAL como saudação/acknowledgment
  IF length(trim(NEW.content)) < 5 THEN
    v_intent := CASE
      WHEN NEW.content ~* '^\s*(oi|ol[áa]|hi|hey|hello|bom dia|boa tarde|boa noite)\s*$' THEN 'saudacao'
      WHEN NEW.content ~* '^\s*(ok|sim|n[ãa]o|nao|beleza|blz|top|joia|jóia)\s*$' THEN 'ack'
      WHEN NEW.content ~* '^\s*$' THEN 'vazia'
      ELSE 'mensagem_curta'
    END;

    UPDATE zapp_history.messages
    SET nlp_processed_at = NOW(),
        primary_intent = v_intent,
        nlp_sentiment = 'neutral',
        lead_score = 0,
        funnel_stage = 'descoberta',
        language_info = jsonb_build_object('lang','pt','dialect',null,'processed_local',true),
        credibility = jsonb_build_object('level','alta','score',100,'flags','[]'::jsonb),
        bant_score = jsonb_build_object('classification','lead_frio','bant_total',10,'budget',0,'authority',0,'need',30,'timeline',10,'processed_local',true)
    WHERE id = NEW.id;

    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, payload_preview, status
    ) VALUES (
      'nlp_short_local', 'messages', NEW.id,
      'Curta processada local: ' || NEW.content, 'processed_local'
    );

    RETURN NEW;
  END IF;

  -- Mensagens normais vão pro NLP remoto
  BEGIN
    v_req_id := zapp_history.request_nlp(NEW.content);
    UPDATE zapp_history.messages SET nlp_request_id = v_req_id WHERE id = NEW.id;

    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, pg_net_request_id, payload_preview, status
    ) VALUES (
      'nlp_pipeline', 'messages', NEW.id, v_req_id, left(NEW.content, 100), 'dispatched'
    );
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, payload_preview, status
    ) VALUES (
      'nlp_pipeline', 'messages', NEW.id, left(NEW.content, 100), 'error: ' || SQLERRM
    );
  END;

  RETURN NEW;
END;
$fn$;

-- Backfill das 4 mensagens zombie existentes
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, content FROM zapp_history.messages WHERE nlp_processed_at IS NULL AND length(trim(content)) < 5
  LOOP
    UPDATE zapp_history.messages
    SET nlp_processed_at = NOW(),
        primary_intent = CASE
          WHEN r.content ~* '^\s*(oi|ol[áa])\s*$' THEN 'saudacao'
          WHEN r.content ~* '^\s*(ok|sim)\s*$' THEN 'ack'
          WHEN r.content ~* '^\s*$' THEN 'vazia'
          ELSE 'mensagem_curta'
        END,
        nlp_sentiment = 'neutral',
        lead_score = 0,
        funnel_stage = 'descoberta',
        language_info = jsonb_build_object('lang','pt','processed_local',true),
        credibility = jsonb_build_object('level','alta','score',100,'flags','[]'::jsonb),
        bant_score = jsonb_build_object('classification','lead_frio','bant_total',10)
    WHERE id = r.id;
  END LOOP;
END $$;
