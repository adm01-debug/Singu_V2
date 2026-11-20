-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409225923
-- nome:   zapp_history_227_smart_routing

CREATE OR REPLACE FUNCTION zapp_history.smart_routing(p_message_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $fn$
DECLARE
  v_msg RECORD;
  v_queue TEXT;
  v_priority INT;
  v_skill_required TEXT[] := ARRAY[]::TEXT[];
  v_reason TEXT;
BEGIN
  SELECT * INTO v_msg FROM zapp_history.messages WHERE id = p_message_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','msg not found'); END IF;

  -- 1) SPAM → quarantine
  IF v_msg.quarantined THEN
    RETURN jsonb_build_object('queue','quarantine','priority',0,'reason','Spam detectado - não atender');
  END IF;

  -- 2) RECLAMAR/CANCELAR → SAC
  IF v_msg.primary_intent IN ('reclamar','cancelar') THEN
    v_queue := 'sac_retencao';
    v_priority := 1;
    v_skill_required := ARRAY['retencao','negociacao'];
    v_reason := 'Cliente reclamando/cancelando - SAC especializado';
  -- 3) BANT SQL + Enterprise → key account manager
  ELSIF v_msg.bant_score->>'classification' = 'SQL_sales_qualified' AND v_msg.company_size->>'size' = 'enterprise' THEN
    v_queue := 'key_account';
    v_priority := 1;
    v_skill_required := ARRAY['enterprise','negociacao_complexa','rfp'];
    v_reason := 'SQL + Enterprise - atendimento VIP';
  -- 4) BANT SQL normal → vendedor sênior
  ELSIF v_msg.bant_score->>'classification' = 'SQL_sales_qualified' THEN
    v_queue := 'vendas_senior';
    v_priority := 2;
    v_skill_required := ARRAY['fechamento'];
    v_reason := 'Lead qualificado para fechamento';
  -- 5) Cliente em inglês → atendente bilíngue
  ELSIF v_msg.language_info->>'lang' = 'en' THEN
    v_queue := 'bilingue';
    v_priority := 2;
    v_skill_required := ARRAY['ingles'];
    v_reason := 'Cliente estrangeiro';
  -- 6) Cliente recorrente → gerente de contas
  ELSIF v_msg.relationship_status->>'status' IN ('recorrente','recorrente_alto') THEN
    v_queue := 'gerente_contas';
    v_priority := 2;
    v_skill_required := ARRAY['fidelizacao'];
    v_reason := 'Cliente recorrente - fidelização';
  -- 7) MQL → vendas padrão
  ELSIF v_msg.bant_score->>'classification' = 'MQL_marketing_qualified' THEN
    v_queue := 'vendas_padrao';
    v_priority := 3;
    v_skill_required := ARRAY['qualificacao'];
    v_reason := 'MQL - qualificar e avançar';
  -- 8) Concorrente com pressão de preço → vendedor especialista
  ELSIF v_msg.competitor_mention->>'context' = 'pressao_preco' THEN
    v_queue := 'vendas_senior';
    v_priority := 2;
    v_skill_required := ARRAY['negociacao_preco'];
    v_reason := 'Disputa com concorrente por preço';
  -- 9) Lead frio → nurturing/bot
  ELSIF v_msg.bant_score->>'classification' IN ('lead_frio','nao_qualificado') THEN
    v_queue := 'nurturing_bot';
    v_priority := 4;
    v_skill_required := ARRAY['educacao'];
    v_reason := 'Lead frio - nurturing automatizado';
  ELSE
    v_queue := 'vendas_padrao';
    v_priority := 3;
    v_skill_required := ARRAY['geral'];
    v_reason := 'Fluxo padrão';
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

GRANT EXECUTE ON FUNCTION zapp_history.smart_routing(UUID) TO authenticated, service_role;
