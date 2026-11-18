-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409225658
-- nome:   zapp_history_222_bant_score

-- BANT score: Budget + Authority + Need + Timeline
CREATE OR REPLACE FUNCTION zapp_history.calculate_bant_score(p_message_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $fn$
DECLARE
  v_msg RECORD;
  v_budget_s INT := 0;
  v_auth_s INT := 0;
  v_need_s INT := 0;
  v_time_s INT := 0;
  v_total INT;
  v_classification TEXT;
BEGIN
  SELECT * INTO v_msg FROM zapp_history.messages WHERE id = p_message_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','msg not found'); END IF;

  -- B: Budget
  IF v_msg.budget_detected IS NOT NULL THEN v_budget_s := 100;
  ELSIF v_msg.budget_sensitivity->>'sensitivity' = 'baixa' THEN v_budget_s := 75;
  ELSIF v_msg.budget_sensitivity->>'sensitivity' = 'media' THEN v_budget_s := 50;
  ELSIF v_msg.budget_sensitivity->>'sensitivity' = 'alta' THEN v_budget_s := 25;
  END IF;

  -- A: Authority
  IF v_msg.decision_authority->>'level' = 'total' THEN v_auth_s := 100;
  ELSIF v_msg.decision_authority->>'level' = 'parcial' THEN v_auth_s := 60;
  ELSIF v_msg.decision_authority->>'level' = 'compartilhada' THEN v_auth_s := 40;
  ELSIF v_msg.decision_authority->>'level' = 'nenhuma' THEN v_auth_s := 15;
  END IF;

  -- N: Need
  IF v_msg.nlp_structured_order ? 'product' AND v_msg.nlp_structured_order ? 'quantity' THEN v_need_s := 100;
  ELSIF v_msg.nlp_structured_order ? 'product' THEN v_need_s := 60;
  ELSIF v_msg.primary_intent IN ('cotar','comprar') THEN v_need_s := 50;
  ELSIF v_msg.primary_intent = 'perguntar' THEN v_need_s := 30;
  ELSE v_need_s := 10;
  END IF;

  -- T: Timeline
  IF v_msg.delivery_preference->>'urgency' = 'imediato' OR v_msg.nlp_sentiment = 'urgent' THEN v_time_s := 100;
  ELSIF v_msg.delivery_preference->>'urgency' = 'proximo_dia' THEN v_time_s := 85;
  ELSIF v_msg.delivery_preference->>'urgency' = 'semana' THEN v_time_s := 65;
  ELSIF v_msg.nlp_structured_order ? 'deadline' THEN v_time_s := 75;
  ELSIF v_msg.delivery_preference->>'urgency' = 'proxima_semana' THEN v_time_s := 50;
  ELSIF v_msg.delivery_preference->>'urgency' = 'sem_pressa' THEN v_time_s := 20;
  ELSE v_time_s := 30;
  END IF;

  v_total := (v_budget_s + v_auth_s + v_need_s + v_time_s) / 4;

  v_classification := CASE
    WHEN v_total >= 80 THEN 'SQL_sales_qualified'
    WHEN v_total >= 60 THEN 'MQL_marketing_qualified'
    WHEN v_total >= 40 THEN 'lead_aquecendo'
    WHEN v_total >= 20 THEN 'lead_frio'
    ELSE 'nao_qualificado'
  END;

  RETURN jsonb_build_object(
    'bant_total', v_total,
    'classification', v_classification,
    'budget', v_budget_s,
    'authority', v_auth_s,
    'need', v_need_s,
    'timeline', v_time_s
  );
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS bant_score JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_bant ON zapp_history.messages((bant_score->>'classification'))
  WHERE bant_score IS NOT NULL;
GRANT EXECUTE ON FUNCTION zapp_history.calculate_bant_score(UUID) TO authenticated, service_role;
