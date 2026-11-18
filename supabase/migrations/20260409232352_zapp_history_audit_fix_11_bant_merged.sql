-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409232352
-- nome:   zapp_history_audit_fix_11_bant_merged

CREATE OR REPLACE FUNCTION zapp_history.calculate_bant_score(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
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

  -- ⛔ OVERRIDE 1: reclamação/cancelamento SEMPRE vira churn_risco_sac
  IF v_msg.primary_intent IN ('reclamar','cancelar') THEN
    RETURN jsonb_build_object(
      'classification','churn_risco_sac',
      'bant_total',0,
      'budget',0,'authority',0,'need',0,'timeline',0,
      'override_reason','Intent reclamar/cancelar - retenção obrigatória SAC'
    );
  END IF;

  -- ⛔ OVERRIDE 2: spam quarentenado = não qualificado
  IF COALESCE(v_msg.quarantined, FALSE) THEN
    RETURN jsonb_build_object(
      'classification','nao_qualificado_spam',
      'bant_total',0,'budget',0,'authority',0,'need',0,'timeline',0,
      'override_reason','Mensagem quarentenada como spam'
    );
  END IF;

  -- ⛔ OVERRIDE 3: credibilidade crítica = não qualificado
  IF (v_msg.credibility->>'level') = 'critica_spam' THEN
    RETURN jsonb_build_object(
      'classification','nao_qualificado_spam',
      'bant_total',0,'budget',0,'authority',0,'need',0,'timeline',0,
      'override_reason','Credibilidade crítica'
    );
  END IF;

  -- B: Budget
  IF v_msg.budget_detected IS NOT NULL THEN v_budget_s := 100;
  ELSIF (v_msg.budget_sensitivity->>'sensitivity') = 'baixa' THEN v_budget_s := 75;
  ELSIF (v_msg.budget_sensitivity->>'sensitivity') = 'media' THEN v_budget_s := 50;
  ELSIF (v_msg.budget_sensitivity->>'sensitivity') = 'alta' THEN v_budget_s := 25;
  END IF;

  -- A: Authority
  IF (v_msg.decision_authority->>'level') = 'total' THEN v_auth_s := 100;
  ELSIF (v_msg.decision_authority->>'level') = 'parcial' THEN v_auth_s := 60;
  ELSIF (v_msg.decision_authority->>'level') = 'compartilhada' THEN v_auth_s := 40;
  ELSIF (v_msg.decision_authority->>'level') = 'nenhuma' THEN v_auth_s := 15;
  END IF;

  -- N: Need (reforçado com CNPJ)
  IF (v_msg.nlp_structured_order ? 'product') AND (v_msg.nlp_structured_order ? 'quantity') AND (v_msg.nlp_structured_order ? 'cnpj') THEN v_need_s := 100;
  ELSIF (v_msg.nlp_structured_order ? 'product') AND (v_msg.nlp_structured_order ? 'quantity') THEN v_need_s := 85;
  ELSIF v_msg.nlp_structured_order ? 'product' THEN v_need_s := 60;
  ELSIF v_msg.primary_intent IN ('cotar','comprar') THEN v_need_s := 50;
  ELSIF v_msg.primary_intent = 'perguntar' THEN v_need_s := 30;
  ELSE v_need_s := 10;
  END IF;

  -- T: Timeline
  IF (v_msg.delivery_preference->>'urgency') = 'imediato' OR v_msg.nlp_sentiment = 'urgent' THEN v_time_s := 100;
  ELSIF (v_msg.delivery_preference->>'urgency') = 'proximo_dia' THEN v_time_s := 85;
  ELSIF (v_msg.delivery_preference->>'urgency') = 'semana' THEN v_time_s := 65;
  ELSIF v_msg.nlp_structured_order ? 'deadline' THEN v_time_s := 75;
  ELSIF (v_msg.delivery_preference->>'urgency') = 'proxima_semana' THEN v_time_s := 50;
  ELSIF (v_msg.delivery_preference->>'urgency') = 'sem_pressa' THEN v_time_s := 20;
  ELSE v_time_s := 30;
  END IF;

  v_total := (v_budget_s + v_auth_s + v_need_s + v_time_s) / 4;

  -- BOOST: se lead_score >= 80, considera SQL automaticamente
  IF COALESCE(v_msg.lead_score, 0) >= 80 THEN
    v_classification := 'SQL_sales_qualified';
    v_total := GREATEST(v_total, 80);
  ELSE
    v_classification := CASE
      WHEN v_total >= 80 THEN 'SQL_sales_qualified'
      WHEN v_total >= 60 THEN 'MQL_marketing_qualified'
      WHEN v_total >= 40 THEN 'lead_aquecendo'
      WHEN v_total >= 20 THEN 'lead_frio'
      ELSE 'nao_qualificado'
    END;
  END IF;

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

-- Backfill completo em todas mensagens
UPDATE zapp_history.messages SET bant_score = zapp_history.calculate_bant_score(id)
WHERE nlp_processed_at IS NOT NULL;
