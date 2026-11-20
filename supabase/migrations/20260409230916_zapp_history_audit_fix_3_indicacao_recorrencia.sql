-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409230916
-- nome:   zapp_history_audit_fix_3_indicacao_recorrencia

-- Ajusta relationship_status pra também detectar TEXTUALMENTE ("sou cliente há anos")
CREATE OR REPLACE FUNCTION zapp_history.detect_relationship_status(p_contact_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $fn$
DECLARE
  v_total INT;
  v_first_msg TIMESTAMPTZ;
  v_last_msg TIMESTAMPTZ;
  v_days_since_first INT;
  v_days_since_last INT;
  v_status TEXT;
  v_label TEXT;
  v_text_lower TEXT;
BEGIN
  IF p_contact_id IS NULL THEN RETURN jsonb_build_object('status','unknown'); END IF;

  SELECT COUNT(*), MIN(created_at), MAX(created_at)
  INTO v_total, v_first_msg, v_last_msg
  FROM zapp_history.messages WHERE contact_id = p_contact_id AND direction = 'inbound';

  -- Também verifica se TEXTUALMENTE a mensagem recente diz ser recorrente
  SELECT lower(content) INTO v_text_lower
  FROM zapp_history.messages
  WHERE contact_id = p_contact_id AND direction = 'inbound'
  ORDER BY created_at DESC LIMIT 1;

  IF v_total IS NULL OR v_total = 0 THEN RETURN jsonb_build_object('status','novo','total_msgs',0); END IF;

  v_days_since_first := EXTRACT(DAY FROM (NOW() - v_first_msg))::INT;
  v_days_since_last := EXTRACT(DAY FROM (NOW() - v_last_msg))::INT;

  -- Override textual: se cliente diz "sou cliente há anos", força recorrente_autoindicado
  IF v_text_lower ~ '(sou cliente há anos|já sou cliente|cliente antig[oa]|j[áa] fiz v[áa]rios pedidos|compro sempre|j[áa] comprei v[áa]rias vezes|mesmo pedido de sempre|aquele pedido de sempre)' THEN
    v_status := 'recorrente_autoindicado';
    v_label := '⭐ Cliente se auto-declara recorrente (' || v_total || ' interações reais)';
  ELSIF v_total = 1 AND v_days_since_first <= 1 THEN
    v_status := 'novo'; v_label := '🆕 Primeiro contato';
  ELSIF v_total <= 3 AND v_days_since_first <= 7 THEN
    v_status := 'iniciante'; v_label := '🌱 Iniciando relacionamento';
  ELSIF v_days_since_last > 90 THEN
    v_status := 'retornante'; v_label := '🔄 Retornou após ' || v_days_since_last || ' dias';
  ELSIF v_total >= 20 AND v_days_since_last <= 30 THEN
    v_status := 'recorrente_alto'; v_label := '⭐ Cliente recorrente ativo (' || v_total || ' interações)';
  ELSIF v_total >= 5 THEN
    v_status := 'recorrente'; v_label := '🤝 Cliente recorrente (' || v_total || ' interações)';
  ELSE
    v_status := 'em_desenvolvimento'; v_label := '📈 Em desenvolvimento';
  END IF;

  RETURN jsonb_build_object(
    'status', v_status, 'label', v_label, 'total_msgs', v_total,
    'days_since_first', v_days_since_first, 'days_since_last', v_days_since_last
  );
END;
$fn$;

-- Adiciona bump no lead_score quando há indicação pessoal
CREATE OR REPLACE FUNCTION zapp_history.trg_calculate_lead_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE v_score INT := 0;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;

  -- Sinais base
  IF NEW.nlp_structured_order ? 'product' THEN v_score := v_score + 25; END IF;
  IF NEW.nlp_structured_order ? 'quantity' THEN v_score := v_score + 15; END IF;
  IF NEW.nlp_structured_order ? 'cnpj' THEN v_score := v_score + 20; END IF;
  IF NEW.budget_detected IS NOT NULL THEN v_score := v_score + 15; END IF;
  IF NEW.nlp_sentiment = 'urgent' THEN v_score := v_score + 15; END IF;

  -- Sinais de engajamento
  IF array_length(NEW.buying_triggers, 1) >= 2 THEN v_score := v_score + 10; END IF;
  IF NEW.funnel_stage IN ('fechamento','proposta','negociacao') THEN v_score := v_score + 10; END IF;

  -- Bump por indicação (crítico: indicação converte 5-8x mais)
  IF NEW.referral_source->>'source' = 'indicacao_pessoa' THEN v_score := v_score + 20; END IF;
  IF NEW.referral_source->>'source' = 'cliente_recorrente' THEN v_score := v_score + 15; END IF;

  -- Bump por relacionamento (cliente recorrente vale muito mais)
  IF NEW.relationship_status->>'status' IN ('recorrente','recorrente_alto','recorrente_autoindicado') THEN v_score := v_score + 15; END IF;

  -- Penalidades
  IF NEW.primary_intent IN ('reclamar','cancelar') THEN v_score := 0; END IF;
  IF NEW.quarantined THEN v_score := 0; END IF;
  IF NEW.hesitation->>'level' = 'alta' THEN v_score := v_score - 10; END IF;
  IF NEW.credibility->>'level' IN ('baixa','critica_spam') THEN v_score := v_score - 15; END IF;

  IF v_score < 0 THEN v_score := 0; END IF;
  IF v_score > 100 THEN v_score := 100; END IF;

  UPDATE zapp_history.messages SET lead_score = v_score WHERE id = NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$fn$;
