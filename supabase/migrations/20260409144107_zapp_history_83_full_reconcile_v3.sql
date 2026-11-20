-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409144107
-- nome:   zapp_history_83_full_reconcile_v3

CREATE OR REPLACE FUNCTION zapp_history.reconcile_nlp_responses()
RETURNS TABLE (reconciled_count INTEGER, errors_count INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE
  r RECORD;
  v_response RECORD;
  v_body JSONB;
  v_count INTEGER := 0;
  v_errors INTEGER := 0;
  v_struct_order JSONB;
  v_extracted_product TEXT;
  v_extracted_qty INTEGER;
  v_extracted_deadline TEXT;
  v_budget NUMERIC;
  v_channel TEXT;
BEGIN
  FOR r IN
    SELECT id, nlp_request_id, content
    FROM zapp_history.messages
    WHERE nlp_request_id IS NOT NULL AND nlp_processed_at IS NULL
    ORDER BY created_at ASC LIMIT 500
  LOOP
    BEGIN
      SELECT status_code, content::text AS content_text INTO v_response
      FROM net._http_response WHERE id = r.nlp_request_id;

      IF v_response IS NULL THEN CONTINUE; END IF;

      IF v_response.status_code = 200 THEN
        v_body := v_response.content_text::jsonb;
        v_struct_order := COALESCE(v_body->'ner'->'structured_order', '{}'::jsonb);

        IF NOT (v_struct_order ? 'product') THEN
          v_extracted_product := zapp_history.extract_product_from_text(r.content);
          IF v_extracted_product IS NOT NULL THEN
            v_struct_order := v_struct_order || jsonb_build_object('product', v_extracted_product);
          END IF;
        END IF;

        IF NOT (v_struct_order ? 'quantity') THEN
          v_extracted_qty := zapp_history.extract_quantity_from_text(r.content);
          IF v_extracted_qty IS NOT NULL THEN
            v_struct_order := v_struct_order || jsonb_build_object('quantity', v_extracted_qty);
          END IF;
        END IF;

        IF NOT (v_struct_order ? 'deadline') THEN
          v_extracted_deadline := zapp_history.extract_deadline_from_text(r.content);
          IF v_extracted_deadline IS NOT NULL THEN
            v_struct_order := v_struct_order || jsonb_build_object('deadline', v_extracted_deadline);
          END IF;
        END IF;

        v_budget := zapp_history.extract_budget_from_text(r.content);
        v_channel := zapp_history.extract_discovery_channel(r.content);

        IF v_budget IS NOT NULL THEN
          v_struct_order := v_struct_order || jsonb_build_object('budget', v_budget);
        END IF;

        UPDATE zapp_history.messages
        SET
          nlp_entities = v_body->'ner'->'entities',
          nlp_structured_order = v_struct_order,
          nlp_sentiment = v_body->'sentiment'->>'label',
          nlp_sentiment_score = (v_body->'sentiment'->>'score')::numeric,
          budget_detected = v_budget,
          discovery_channel = v_channel,
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
