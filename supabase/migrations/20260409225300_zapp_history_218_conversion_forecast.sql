-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409225300
-- nome:   zapp_history_218_conversion_forecast

-- Calcula probabilidade de conversão baseada em sinais positivos/negativos
CREATE OR REPLACE FUNCTION zapp_history.calculate_conversion_probability(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $fn$
DECLARE
  v_msg RECORD;
  v_prob NUMERIC := 0;
  v_positive TEXT[] := ARRAY[]::TEXT[];
  v_negative TEXT[] := ARRAY[]::TEXT[];
  v_forecast TEXT;
BEGIN
  SELECT * INTO v_msg FROM zapp_history.messages WHERE id = p_message_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','msg not found'); END IF;

  -- Base do lead score
  v_prob := COALESCE(v_msg.lead_score, 0);

  -- Sinais POSITIVOS (aumentam)
  IF v_msg.funnel_stage = 'fechamento' THEN v_prob := v_prob + 15; v_positive := array_append(v_positive,'na_etapa_fechamento'); END IF;
  IF v_msg.primary_intent = 'comprar' THEN v_prob := v_prob + 20; v_positive := array_append(v_positive,'intent_comprar'); END IF;
  IF array_length(v_msg.buying_triggers,1) >= 2 THEN v_prob := v_prob + 10; v_positive := array_append(v_positive,'multiplos_gatilhos'); END IF;
  IF v_msg.customer_type = 'b2b' AND (v_msg.nlp_structured_order ? 'cnpj') THEN v_prob := v_prob + 8; v_positive := array_append(v_positive,'b2b_com_cnpj'); END IF;
  IF v_msg.budget_detected IS NOT NULL THEN v_prob := v_prob + 10; v_positive := array_append(v_positive,'budget_mencionado'); END IF;
  IF v_msg.relationship_status->>'status' IN ('recorrente','recorrente_alto') THEN v_prob := v_prob + 12; v_positive := array_append(v_positive,'cliente_recorrente'); END IF;
  IF v_msg.delivery_preference->>'urgency' = 'imediato' THEN v_prob := v_prob + 5; v_positive := array_append(v_positive,'entrega_urgente'); END IF;
  IF v_msg.emotional_state->>'dominant' IN ('felicidade','confianca','empolgacao') THEN v_prob := v_prob + 8; v_positive := array_append(v_positive,'emocao_positiva'); END IF;

  -- Sinais NEGATIVOS (diminuem)
  IF v_msg.hesitation->>'level' = 'alta' THEN v_prob := v_prob - 20; v_negative := array_append(v_negative,'hesitacao_alta'); END IF;
  IF v_msg.hesitation->>'level' = 'media' THEN v_prob := v_prob - 10; v_negative := array_append(v_negative,'hesitacao_media'); END IF;
  IF v_msg.competitor_mention->>'context' = 'pressao_preco' THEN v_prob := v_prob - 15; v_negative := array_append(v_negative,'concorrente_mais_barato'); END IF;
  IF v_msg.competitor_mention->>'context' = 'tem_fornecedor_atual' THEN v_prob := v_prob - 10; v_negative := array_append(v_negative,'tem_outro_fornecedor'); END IF;
  IF array_length(v_msg.objections,1) >= 3 THEN v_prob := v_prob - 15; v_negative := array_append(v_negative,'multiplas_objecoes'); END IF;
  IF v_msg.churn_risk->>'risk' IN ('alto','critico') THEN v_prob := v_prob - 25; v_negative := array_append(v_negative,'risco_churn'); END IF;
  IF v_msg.emotional_state->>'dominant' IN ('raiva','tristeza','ansiedade') THEN v_prob := v_prob - 10; v_negative := array_append(v_negative,'emocao_negativa'); END IF;
  IF v_msg.budget_sensitivity->>'sensitivity' = 'alta' THEN v_prob := v_prob - 5; v_negative := array_append(v_negative,'sensivel_preco'); END IF;
  IF v_msg.primary_intent IN ('reclamar','cancelar') THEN v_prob := v_prob - 30; v_negative := array_append(v_negative,'intent_negativa'); END IF;

  -- Cap 0-100
  IF v_prob < 0 THEN v_prob := 0; END IF;
  IF v_prob > 100 THEN v_prob := 100; END IF;

  v_forecast := CASE
    WHEN v_prob >= 75 THEN '🟢 ALTA - fechamento provável em < 7 dias'
    WHEN v_prob >= 50 THEN '🟡 MÉDIA - lead aquecido, nurturing em 15 dias'
    WHEN v_prob >= 25 THEN '🟠 BAIXA - lead frio, educação necessária'
    ELSE '🔴 MÍNIMA - lead muito frio ou negativo'
  END;

  RETURN jsonb_build_object(
    'probability', v_prob,
    'forecast', v_forecast,
    'positive_signals', to_jsonb(v_positive),
    'negative_signals', to_jsonb(v_negative)
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.calculate_conversion_probability(UUID) TO authenticated, service_role;
