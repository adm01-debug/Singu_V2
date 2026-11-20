-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409135049
-- nome:   zapp_history_53_nlp_pipeline_integration

-- ============================================================================
-- MELHORIA 53: Integra com nlp-pipeline (NER + sentiment + structured_order)
-- que funciona sem token externo. Substitui o trigger de embedding.
-- ============================================================================

-- Adiciona colunas pra resultado do NLP nas messages
ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS nlp_entities JSONB,
  ADD COLUMN IF NOT EXISTS nlp_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS nlp_sentiment_score NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS nlp_structured_order JSONB,
  ADD COLUMN IF NOT EXISTS nlp_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nlp_request_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_messages_nlp_sentiment ON zapp_history.messages(nlp_sentiment) WHERE nlp_sentiment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_nlp_entities ON zapp_history.messages USING GIN (nlp_entities) WHERE nlp_entities IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_nlp_order ON zapp_history.messages USING GIN (nlp_structured_order) WHERE nlp_structured_order IS NOT NULL;

-- Helper que dispara nlp-pipeline
CREATE OR REPLACE FUNCTION zapp_history.request_nlp(p_text TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_url TEXT;
  v_request_id BIGINT;
BEGIN
  v_url := COALESCE(zapp_history.get_config('functions_base_url'),
                    'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1');
  SELECT net.http_post(
    url := v_url || '/nlp-pipeline',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('text', p_text),
    timeout_milliseconds := 30000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$fn$;

-- Trigger novo: dispara nlp-pipeline em vez de embedding
CREATE OR REPLACE FUNCTION zapp_history.trg_auto_request_embedding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_req_id BIGINT;
BEGIN
  IF NEW.message_type <> 'text' OR NEW.content IS NULL OR length(NEW.content) < 5 THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_req_id := zapp_history.request_nlp(NEW.content);

    -- Marca pendente, será lido pelo cron de reconciliação
    UPDATE zapp_history.messages
    SET nlp_request_id = v_req_id
    WHERE id = NEW.id;

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

-- Função de reconciliação: lê resposta async do pg_net e popula a mensagem
CREATE OR REPLACE FUNCTION zapp_history.reconcile_nlp_responses()
RETURNS TABLE (reconciled_count INTEGER, errors_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  r RECORD;
  v_response RECORD;
  v_body JSONB;
  v_count INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  FOR r IN
    SELECT id, nlp_request_id
    FROM zapp_history.messages
    WHERE nlp_request_id IS NOT NULL AND nlp_processed_at IS NULL
    ORDER BY created_at ASC
    LIMIT 500
  LOOP
    BEGIN
      SELECT status_code, content::text AS content_text
      INTO v_response
      FROM net._http_response
      WHERE id = r.nlp_request_id;

      IF v_response IS NULL THEN
        CONTINUE; -- ainda não respondeu
      END IF;

      IF v_response.status_code = 200 THEN
        v_body := v_response.content_text::jsonb;
        UPDATE zapp_history.messages
        SET
          nlp_entities = v_body->'ner'->'entities',
          nlp_structured_order = v_body->'ner'->'structured_order',
          nlp_sentiment = v_body->'sentiment'->>'label',
          nlp_sentiment_score = (v_body->'sentiment'->>'score')::numeric,
          nlp_processed_at = NOW()
        WHERE id = r.id;
        v_count := v_count + 1;
      ELSE
        UPDATE zapp_history.messages
        SET nlp_processed_at = NOW(),
            nlp_entities = jsonb_build_object('error', v_response.content_text, 'status', v_response.status_code)
        WHERE id = r.id;
        v_errors := v_errors + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_count, v_errors;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.request_nlp(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION zapp_history.reconcile_nlp_responses() TO authenticated, service_role;

-- Cron a cada 1 minuto pra reconciliar
SELECT cron.unschedule('zapp-reconcile-nlp') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'zapp-reconcile-nlp');
SELECT cron.schedule('zapp-reconcile-nlp', '* * * * *', $$ SELECT zapp_history.reconcile_nlp_responses() $$);
