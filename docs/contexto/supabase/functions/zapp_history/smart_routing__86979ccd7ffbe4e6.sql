CREATE OR REPLACE FUNCTION zapp_history.smart_routing(p_message_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
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
$function$
