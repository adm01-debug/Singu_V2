CREATE OR REPLACE FUNCTION zapp_history.trg_calculate_lead_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
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
$function$
