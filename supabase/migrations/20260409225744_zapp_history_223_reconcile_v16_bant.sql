-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409225744
-- nome:   zapp_history_223_reconcile_v16_bant

-- Adiciona decision_authority dentro do reconcile principal
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
  v_topics TEXT[];
  v_intent TEXT;
  v_speaker_role TEXT;
  v_complexity JSONB;
  v_emotional JSONB;
  v_question JSONB;
  v_language JSONB;
  v_hesitation JSONB;
  v_credibility JSONB;
  v_company_size JSONB;
  v_seasonality TEXT[];
  v_relationship JSONB;
  v_budget_sens JSONB;
  v_payment_prefs TEXT[];
  v_competitor JSONB;
  v_unit TEXT;
  v_delivery JSONB;
  v_referral JSONB;
  v_authority JSONB;
  v_phone TEXT;
  v_qty_for_type INT;
  v_qty_text TEXT;
  v_temp_score INT;
BEGIN
  FOR r IN
    SELECT m.id, m.nlp_request_id, m.content, m.contact_id, regexp_replace(c.remote_jid, '@.*', '') AS phone
    FROM zapp_history.messages m
    JOIN zapp_history.conversations c ON c.id = m.conversation_id
    WHERE m.nlp_request_id IS NOT NULL AND m.nlp_processed_at IS NULL
    ORDER BY m.created_at ASC LIMIT 500
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
          IF v_extracted_product IS NOT NULL THEN v_struct_order := v_struct_order || jsonb_build_object('product', v_extracted_product); END IF;
        END IF;
        IF NOT (v_struct_order ? 'quantity') THEN
          v_extracted_qty := zapp_history.extract_quantity_from_text(r.content);
          IF v_extracted_qty IS NOT NULL THEN v_struct_order := v_struct_order || jsonb_build_object('quantity', v_extracted_qty); END IF;
        END IF;
        IF NOT (v_struct_order ? 'deadline') THEN
          v_extracted_deadline := zapp_history.extract_deadline_from_text(r.content);
          IF v_extracted_deadline IS NOT NULL THEN v_struct_order := v_struct_order || jsonb_build_object('deadline', v_extracted_deadline); END IF;
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
        v_topics := zapp_history.detect_topics(r.content);
        v_intent := zapp_history.detect_primary_intent(r.content);
        v_speaker_role := zapp_history.detect_speaker_role(r.content);
        v_emotional := zapp_history.detect_emotional_state(r.content);
        v_question := zapp_history.detect_question_type(r.content);
        v_language := zapp_history.detect_language(r.content);
        v_hesitation := zapp_history.detect_hesitation(r.content);
        v_credibility := zapp_history.detect_credibility(r.content, r.phone);
        v_seasonality := zapp_history.detect_seasonality(r.content);
        v_relationship := zapp_history.detect_relationship_status(r.contact_id);
        v_budget_sens := zapp_history.detect_budget_sensitivity(r.content);
        v_payment_prefs := zapp_history.detect_payment_preference(r.content);
        v_competitor := zapp_history.detect_competitor_mention(r.content);
        v_unit := zapp_history.detect_unit_of_measure(r.content);
        v_delivery := zapp_history.detect_delivery_preference(r.content);
        v_referral := zapp_history.detect_referral_source(r.content);
        v_authority := zapp_history.detect_decision_authority(r.content, v_speaker_role);

        IF v_budget IS NOT NULL THEN v_struct_order := v_struct_order || jsonb_build_object('budget', v_budget); END IF;

        v_funnel_stage := zapp_history.detect_funnel_stage(r.content,
          v_struct_order ? 'product', v_struct_order ? 'quantity',
          v_budget IS NOT NULL, v_struct_order ? 'cnpj');

        v_qty_for_type := NULL;
        v_qty_text := v_struct_order->>'quantity';
        IF v_qty_text IS NOT NULL AND v_qty_text ~ '^\d+$' THEN v_qty_for_type := v_qty_text::INT; END IF;

        v_customer_type := zapp_history.classify_customer_type(r.content, v_struct_order ? 'cnpj', v_qty_for_type);
        v_complexity := zapp_history.detect_order_complexity(r.content, v_qty_for_type);
        v_company_size := zapp_history.detect_company_size(r.content, v_qty_for_type, v_budget);

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
          topics = CASE WHEN array_length(v_topics, 1) > 0 THEN v_topics ELSE NULL END,
          primary_intent = v_intent,
          speaker_role = v_speaker_role,
          order_complexity = CASE WHEN (v_complexity->>'level') <> 'indefinido' THEN v_complexity ELSE NULL END,
          emotional_state = CASE WHEN (v_emotional->>'dominant') NOT IN ('indefinido','neutro') THEN v_emotional ELSE NULL END,
          question_analysis = CASE WHEN (v_question->>'has_question')::boolean THEN v_question ELSE NULL END,
          language_info = CASE WHEN (v_language->>'lang') <> 'indefinido' THEN v_language ELSE NULL END,
          hesitation = CASE WHEN (v_hesitation->>'level') <> 'none' THEN v_hesitation ELSE NULL END,
          credibility = v_credibility,
          company_size = CASE WHEN (v_company_size->>'size') <> 'indefinido' THEN v_company_size ELSE NULL END,
          seasonality = CASE WHEN array_length(v_seasonality, 1) > 0 THEN v_seasonality ELSE NULL END,
          relationship_status = v_relationship,
          budget_sensitivity = CASE WHEN (v_budget_sens->>'sensitivity') <> 'indefinido' THEN v_budget_sens ELSE NULL END,
          payment_preferences = CASE WHEN array_length(v_payment_prefs, 1) > 0 THEN v_payment_prefs ELSE NULL END,
          competitor_mention = CASE WHEN (v_competitor->>'mentioned')::boolean THEN v_competitor ELSE NULL END,
          unit_of_measure = v_unit,
          delivery_preference = v_delivery,
          referral_source = v_referral,
          decision_authority = CASE WHEN (v_authority->>'level') <> 'indefinido' THEN v_authority ELSE NULL END,
          nlp_processed_at = NOW()
        WHERE id = r.id;

        -- Calcula BANT depois do update (precisa de todos os campos gravados)
        UPDATE zapp_history.messages
        SET bant_score = zapp_history.calculate_bant_score(r.id)
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
