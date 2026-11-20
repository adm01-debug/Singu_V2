-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409230844
-- nome:   zapp_history_audit_fix_2_bant_negativo

-- Fix: reclamação/cancelamento = classificação separada "churn_risco", não lead_aquecendo
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

  -- OVERRIDE: reclamação/cancelamento sempre vira churn_risco (prioridade SAC)
  IF v_msg.primary_intent IN ('reclamar','cancelar') THEN
    RETURN jsonb_build_object(
      'classification','churn_risco_sac',
      'bant_total',0,
      'budget',0,'authority',0,'need',0,'timeline',0,
      'override_reason','Intent reclamar/cancelar - retenção obrigatória'
    );
  END IF;

  -- OVERRIDE: spam quarentenado vira nao_qualificado
  IF v_msg.quarantined THEN
    RETURN jsonb_build_object(
      'classification','nao_qualificado_spam',
      'bant_total',0,'budget',0,'authority',0,'need',0,'timeline',0,
      'override_reason','Mensagem quarentenada'
    );
  END IF;

  -- Budget
  IF v_msg.budget_detected IS NOT NULL THEN v_budget_s := 100;
  ELSIF v_msg.budget_sensitivity->>'sensitivity' = 'baixa' THEN v_budget_s := 75;
  ELSIF v_msg.budget_sensitivity->>'sensitivity' = 'media' THEN v_budget_s := 50;
  ELSIF v_msg.budget_sensitivity->>'sensitivity' = 'alta' THEN v_budget_s := 25;
  END IF;

  -- Authority
  IF v_msg.decision_authority->>'level' = 'total' THEN v_auth_s := 100;
  ELSIF v_msg.decision_authority->>'level' = 'parcial' THEN v_auth_s := 60;
  ELSIF v_msg.decision_authority->>'level' = 'compartilhada' THEN v_auth_s := 40;
  ELSIF v_msg.decision_authority->>'level' = 'nenhuma' THEN v_auth_s := 15;
  END IF;

  -- Need (reforçado com CNPJ, produto, quantidade juntos)
  IF v_msg.nlp_structured_order ? 'product' AND v_msg.nlp_structured_order ? 'quantity' AND v_msg.nlp_structured_order ? 'cnpj' THEN v_need_s := 100;
  ELSIF v_msg.nlp_structured_order ? 'product' AND v_msg.nlp_structured_order ? 'quantity' THEN v_need_s := 85;
  ELSIF v_msg.nlp_structured_order ? 'product' THEN v_need_s := 60;
  ELSIF v_msg.primary_intent IN ('cotar','comprar') THEN v_need_s := 50;
  ELSIF v_msg.primary_intent = 'perguntar' THEN v_need_s := 30;
  ELSE v_need_s := 10;
  END IF;

  -- Timeline
  IF v_msg.delivery_preference->>'urgency' = 'imediato' OR v_msg.nlp_sentiment = 'urgent' THEN v_time_s := 100;
  ELSIF v_msg.delivery_preference->>'urgency' = 'proximo_dia' THEN v_time_s := 85;
  ELSIF v_msg.delivery_preference->>'urgency' = 'semana' THEN v_time_s := 65;
  ELSIF v_msg.nlp_structured_order ? 'deadline' THEN v_time_s := 75;
  ELSIF v_msg.delivery_preference->>'urgency' = 'proxima_semana' THEN v_time_s := 50;
  ELSIF v_msg.delivery_preference->>'urgency' = 'sem_pressa' THEN v_time_s := 20;
  ELSE v_time_s := 30;
  END IF;

  -- BOOST por lead_score alto: se lead_score >= 80 e tem pedido completo, força mínimo MQL
  v_total := (v_budget_s + v_auth_s + v_need_s + v_time_s) / 4;

  -- BOOST: lead_score muito alto + sentiment urgent = SQL automático
  IF v_msg.lead_score >= 85 AND v_msg.nlp_sentiment = 'urgent' AND v_msg.nlp_structured_order ? 'product' THEN
    v_total := GREATEST(v_total, 80);
  END IF;

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

-- Backfill: recalcula BANT pras mensagens existentes
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM zapp_history.messages WHERE nlp_processed_at IS NOT NULL
  LOOP
    UPDATE zapp_history.messages
    SET bant_score = zapp_history.calculate_bant_score(r.id)
    WHERE id = r.id;
  END LOOP;
END $$;
