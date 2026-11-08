CREATE OR REPLACE FUNCTION public.persist_rfm_analysis(_rows jsonb, _user_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _owner uuid := COALESCE(_user_id, auth.uid());
  _saved integer;
BEGIN
  IF _owner IS NULL OR (current_user NOT IN ('postgres', 'service_role')
      AND _owner IS DISTINCT FROM auth.uid()) THEN
    RAISE EXCEPTION 'usuário RFM não autorizado' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'análises RFM devem ser uma lista' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(_rows) > 10000 THEN
    RAISE EXCEPTION 'limite de análises RFM excedido' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_populate_recordset(NULL::public.rfm_analysis, _rows) r
    WHERE r.user_id IS DISTINCT FROM _owner OR r.contact_id IS NULL
      OR NOT EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = r.contact_id AND c.user_id = _owner)
  ) THEN
    RAISE EXCEPTION 'contato RFM não pertence ao usuário' USING ERRCODE = '42501';
  END IF;
  WITH saved AS (
    INSERT INTO public.rfm_analysis (
      user_id, contact_id, recency_score, frequency_score, monetary_score,
      days_since_last_purchase, days_since_last_interaction, total_purchases, total_interactions,
      total_monetary_value, average_order_value, segment, segment_code, segment_description,
      segment_color, churn_probability, communication_priority, predicted_next_purchase_date,
      predicted_lifetime_value, recommended_actions, recommended_offers, analyzed_at
    )
    SELECT r.user_id, r.contact_id, r.recency_score, r.frequency_score, r.monetary_score,
      r.days_since_last_purchase, r.days_since_last_interaction, r.total_purchases, r.total_interactions,
      r.total_monetary_value, r.average_order_value, r.segment, r.segment_code, r.segment_description,
      r.segment_color, r.churn_probability, r.communication_priority, r.predicted_next_purchase_date,
      r.predicted_lifetime_value, r.recommended_actions, r.recommended_offers, COALESCE(r.analyzed_at, now())
    FROM jsonb_populate_recordset(NULL::public.rfm_analysis, _rows) r
    ON CONFLICT (user_id, contact_id) DO UPDATE SET
      recency_score = EXCLUDED.recency_score, frequency_score = EXCLUDED.frequency_score,
      monetary_score = EXCLUDED.monetary_score, days_since_last_purchase = EXCLUDED.days_since_last_purchase,
      days_since_last_interaction = EXCLUDED.days_since_last_interaction,
      total_purchases = EXCLUDED.total_purchases, total_interactions = EXCLUDED.total_interactions,
      total_monetary_value = EXCLUDED.total_monetary_value, average_order_value = EXCLUDED.average_order_value,
      segment = EXCLUDED.segment, segment_code = EXCLUDED.segment_code,
      segment_description = EXCLUDED.segment_description, segment_color = EXCLUDED.segment_color,
      churn_probability = EXCLUDED.churn_probability, communication_priority = EXCLUDED.communication_priority,
      predicted_next_purchase_date = EXCLUDED.predicted_next_purchase_date,
      predicted_lifetime_value = EXCLUDED.predicted_lifetime_value,
      recommended_actions = EXCLUDED.recommended_actions, recommended_offers = EXCLUDED.recommended_offers,
      analyzed_at = EXCLUDED.analyzed_at, updated_at = now()
    RETURNING user_id, contact_id, recency_score, frequency_score, monetary_score, segment, total_monetary_value
  )
  INSERT INTO public.rfm_history (user_id, contact_id, recency_score, frequency_score, monetary_score, segment, total_monetary_value)
  SELECT user_id, contact_id, recency_score, frequency_score, monetary_score, segment, total_monetary_value FROM saved;
  GET DIAGNOSTICS _saved = ROW_COUNT;
  RETURN _saved;
END;
$function$
