-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409230953
-- nome:   audit_fix_07_smart_routing_and_bant

-- F13: BANT classification + lead_score. Se lead_score >= 80, força SQL independente das dimensões BANT
CREATE OR REPLACE FUNCTION zapp_history.calculate_bant_score(p_message_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp AS $fn$
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

  -- N: Need
  IF (v_msg.nlp_structured_order ? 'product') AND (v_msg.nlp_structured_order ? 'quantity') THEN v_need_s := 100;
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

  -- F13 FIX: Se lead_score já é >= 80, considera SQL automaticamente
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

-- F8: Smart routing com pressao_preco prioridade alta + lead com produto+qty detectados não vai pra bot
CREATE OR REPLACE FUNCTION zapp_history.smart_routing(p_message_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp AS $fn$
DECLARE
  v_msg RECORD;
  v_queue TEXT;
  v_priority INT;
  v_skill_required TEXT[] := ARRAY[]::TEXT[];
  v_reason TEXT;
  v_has_commercial BOOLEAN;
BEGIN
  SELECT * INTO v_msg FROM zapp_history.messages WHERE id = p_message_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','msg not found'); END IF;

  -- 1) SPAM
  IF COALESCE(v_msg.quarantined, FALSE) THEN
    RETURN jsonb_build_object('queue','quarantine','priority',0,'reason','Spam detectado','sla_minutes',0);
  END IF;

  -- Leads com sinal comercial (produto + quantidade) nunca vão pra bot mesmo com score baixo
  v_has_commercial := (v_msg.nlp_structured_order ? 'product')
                  AND (v_msg.nlp_structured_order ? 'quantity');

  -- 2) RECLAMAR/CANCELAR → SAC
  IF v_msg.primary_intent IN ('reclamar','cancelar') THEN
    v_queue := 'sac_retencao'; v_priority := 1; v_skill_required := ARRAY['retencao','negociacao'];
    v_reason := 'Cliente reclamando/cancelando - SAC especializado';
  -- 3) SQL + Enterprise → Key Account
  ELSIF v_msg.bant_score->>'classification' = 'SQL_sales_qualified'
        AND (v_msg.company_size->>'size') IN ('enterprise','grande') THEN
    v_queue := 'key_account'; v_priority := 1;
    v_skill_required := ARRAY['enterprise','negociacao_complexa','rfp'];
    v_reason := 'SQL + Enterprise - atendimento VIP';
  -- 4) SQL → Vendas Sênior
  ELSIF v_msg.bant_score->>'classification' = 'SQL_sales_qualified' THEN
    v_queue := 'vendas_senior'; v_priority := 2;
    v_skill_required := ARRAY['fechamento'];
    v_reason := 'Lead qualificado para fechamento';
  -- 5) Concorrente pressionando preço → Vendas Sênior (negociação)
  ELSIF (v_msg.competitor_mention->>'context') = 'pressao_preco' THEN
    v_queue := 'vendas_senior'; v_priority := 2;
    v_skill_required := ARRAY['negociacao_preco'];
    v_reason := 'Disputa com concorrente - especialista em negociação';
  -- 6) Inglês
  ELSIF (v_msg.language_info->>'lang') = 'en' THEN
    v_queue := 'bilingue'; v_priority := 2;
    v_skill_required := ARRAY['ingles'];
    v_reason := 'Cliente estrangeiro';
  -- 7) Cliente recorrente → Gerente de Contas
  ELSIF (v_msg.relationship_status->>'status') IN ('recorrente','recorrente_alto') THEN
    v_queue := 'gerente_contas'; v_priority := 2;
    v_skill_required := ARRAY['fidelizacao'];
    v_reason := 'Cliente recorrente - fidelização';
  -- 8) Indicação com sinal comercial
  ELSIF (v_msg.referral_source->>'source') = 'indicacao_pessoa' THEN
    v_queue := 'vendas_senior'; v_priority := 2;
    v_skill_required := ARRAY['indicacao'];
    v_reason := 'Lead por indicação - conversão alta esperada';
  -- 9) Enterprise (mesmo sem SQL) → Key Account para qualificação
  ELSIF (v_msg.company_size->>'size') = 'enterprise' THEN
    v_queue := 'key_account'; v_priority := 2;
    v_skill_required := ARRAY['enterprise'];
    v_reason := 'Enterprise em qualificação';
  -- 10) MQL ou tem sinal comercial forte
  ELSIF v_msg.bant_score->>'classification' = 'MQL_marketing_qualified' OR v_has_commercial THEN
    v_queue := 'vendas_padrao'; v_priority := 3;
    v_skill_required := ARRAY['qualificacao'];
    v_reason := 'Lead com sinal comercial - qualificar';
  -- 11) Lead aquecendo ou perguntando
  ELSIF v_msg.bant_score->>'classification' = 'lead_aquecendo'
        OR v_msg.primary_intent IN ('cotar','perguntar','negociar') THEN
    v_queue := 'vendas_padrao'; v_priority := 3;
    v_skill_required := ARRAY['qualificacao'];
    v_reason := 'Lead em aquecimento - nutrição ativa';
  -- 12) Lead frio de verdade → bot
  ELSE
    v_queue := 'nurturing_bot'; v_priority := 4;
    v_skill_required := ARRAY['educacao'];
    v_reason := 'Lead frio - nurturing automatizado';
  END IF;

  RETURN jsonb_build_object(
    'queue', v_queue,
    'priority', v_priority,
    'skills_required', to_jsonb(v_skill_required),
    'reason', v_reason,
    'sla_minutes', CASE v_priority
      WHEN 1 THEN 5 WHEN 2 THEN 15 WHEN 3 THEN 60 ELSE 240
    END
  );
END;
$fn$;
