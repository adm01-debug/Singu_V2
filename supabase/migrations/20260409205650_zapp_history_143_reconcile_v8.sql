-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409205650
-- nome:   zapp_history_143_reconcile_v8

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
  v_objections TEXT[];
  v_funnel_stage TEXT;
  v_contact_info JSONB;
  v_location JSONB;
  v_tone JSONB;
  v_customer_type TEXT;
  v_event_type TEXT;
  v_buying_triggers TEXT[];
  v_churn JSONB;
  v_disc JSONB;
  v_journey TEXT;
  v_qty_for_type INT;
  v_qty_text TEXT;
  v_temp_score INT;
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
        v_objections := zapp_history.extract_objections(r.content);
        v_contact_info := zapp_history.extract_contact_info(r.content);
        v_location := zapp_history.extract_location(r.content);
        v_tone := zapp_history.detect_communication_tone(r.content);
        v_event_type := zapp_history.detect_event_type(r.content);
        v_buying_triggers := zapp_history.detect_buying_triggers(r.content);
        v_churn := zapp_history.detect_churn_risk(r.content);
        v_disc := zapp_history.detect_disc_profile(r.content);

        IF v_budget IS NOT NULL THEN
          v_struct_order := v_struct_order || jsonb_build_object('budget', v_budget);
        END IF;

        v_funnel_stage := zapp_history.detect_funnel_stage(
          r.content,
          v_struct_order ? 'product',
          v_struct_order ? 'quantity',
          v_budget IS NOT NULL,
          v_struct_order ? 'cnpj'
        );

        v_qty_for_type := NULL;
        v_qty_text := v_struct_order->>'quantity';
        IF v_qty_text IS NOT NULL AND v_qty_text ~ '^\d+$' THEN
          v_qty_for_type := v_qty_text::INT;
        END IF;

        v_customer_type := zapp_history.classify_customer_type(
          r.content, v_struct_order ? 'cnpj', v_qty_for_type
        );

        -- Calcula lead_score temporário pra usar no journey_stage
        v_temp_score := 0;
        IF v_struct_order ? 'product' THEN v_temp_score := v_temp_score + 25; END IF;
        IF v_struct_order ? 'quantity' THEN v_temp_score := v_temp_score + 15; END IF;
        IF v_struct_order ? 'cnpj' THEN v_temp_score := v_temp_score + 20; END IF;
        IF (v_body->'sentiment'->>'label') = 'urgent' THEN v_temp_score := v_temp_score + 15; END IF;
        IF v_budget IS NOT NULL THEN v_temp_score := v_temp_score + 15; END IF;

        v_journey := zapp_history.detect_journey_stage(r.content, v_funnel_stage, v_temp_score);

        UPDATE zapp_history.messages
        SET
          nlp_entities = v_body->'ner'->'entities',
          nlp_structured_order = v_struct_order,
          nlp_sentiment = v_body->'sentiment'->>'label',
          nlp_sentiment_score = (v_body->'sentiment'->>'score')::numeric,
          budget_detected = v_budget,
          discovery_channel = v_channel,
          objections = CASE WHEN array_length(v_objections, 1) > 0 THEN v_objections ELSE NULL END,
          funnel_stage = v_funnel_stage,
          contact_info_extracted = CASE WHEN v_contact_info <> '{}'::jsonb THEN v_contact_info ELSE NULL END,
          location_extracted = v_location,
          communication_tone = v_tone,
          customer_type = v_customer_type,
          event_type = v_event_type,
          buying_triggers = CASE WHEN array_length(v_buying_triggers, 1) > 0 THEN v_buying_triggers ELSE NULL END,
          churn_risk = CASE WHEN (v_churn->>'risk') <> 'none' THEN v_churn ELSE NULL END,
          disc_profile = CASE WHEN (v_disc->>'profile') <> 'indefinido' THEN v_disc ELSE NULL END,
          journey_stage = v_journey,
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
