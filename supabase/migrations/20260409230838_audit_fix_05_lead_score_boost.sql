-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409230838
-- nome:   audit_fix_05_lead_score_boost

-- Lead score v2: adiciona sinais que antes eram ignorados
CREATE OR REPLACE FUNCTION zapp_history.calculate_lead_score(p_message_id UUID)
RETURNS INT LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp AS $fn$
DECLARE
  v_msg RECORD;
  v_score INT := 0;
  v_text_lower TEXT;
BEGIN
  SELECT * INTO v_msg FROM zapp_history.messages WHERE id = p_message_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  v_text_lower := lower(COALESCE(v_msg.content, ''));

  -- Base: sinais comerciais fortes
  IF v_msg.nlp_structured_order ? 'product' THEN v_score := v_score + 25; END IF;
  IF v_msg.nlp_structured_order ? 'quantity' THEN v_score := v_score + 15; END IF;
  IF v_msg.nlp_structured_order ? 'cnpj' THEN v_score := v_score + 20; END IF;
  IF v_msg.budget_detected IS NOT NULL THEN v_score := v_score + 15; END IF;
  IF v_msg.nlp_structured_order ? 'deadline' THEN v_score := v_score + 10; END IF;

  -- Sentimento
  IF v_msg.nlp_sentiment = 'urgent' THEN v_score := v_score + 15; END IF;
  IF v_msg.nlp_sentiment = 'positive' THEN v_score := v_score + 5; END IF;

  -- Intent comercial
  IF v_msg.primary_intent IN ('comprar','cotar') THEN v_score := v_score + 10; END IF;
  IF v_msg.primary_intent IN ('reclamar','cancelar') THEN v_score := v_score - 20; END IF;

  -- Enterprise / RFP (BOOST crítico que estava faltando)
  IF (v_msg.company_size->>'size') IN ('enterprise','grande') THEN v_score := v_score + 15; END IF;
  IF v_text_lower ~ '(rfp|rfq|licita[çc][ãa]o|preg[ãa]o|tomada de pre[çc]o|concorr[êe]ncia|processo licitat[óo]rio)' THEN
    v_score := v_score + 20;
  END IF;

  -- Volume alto
  IF (v_msg.nlp_structured_order->>'quantity') ~ '^\d+$' AND (v_msg.nlp_structured_order->>'quantity')::INT >= 1000 THEN
    v_score := v_score + 10;
  END IF;

  -- Indicação (vem aquecido)
  IF (v_msg.referral_source->>'source') = 'indicacao_pessoa' THEN v_score := v_score + 20; END IF;
  IF (v_msg.referral_source->>'source') = 'cliente_recorrente' THEN v_score := v_score + 15; END IF;

  -- Cliente auto-declarando recorrente no texto
  IF v_text_lower ~ '(j[áa] (sou |fui )?cliente|j[áa] comprei aqui|sou cliente h[áa] anos|cliente antig[oa]|pedido de sempre|aquele mesmo pedido)' THEN
    v_score := v_score + 15;
  END IF;

  -- Gatilhos de compra
  IF array_length(v_msg.buying_triggers, 1) >= 2 THEN v_score := v_score + 10; END IF;

  -- Pressão de concorrente (não penaliza, oportunidade)
  IF (v_msg.competitor_mention->>'context') = 'pressao_preco' THEN v_score := v_score + 10; END IF;

  -- B2B confirmado
  IF v_msg.customer_type = 'b2b' AND (v_msg.nlp_structured_order ? 'cnpj') THEN v_score := v_score + 5; END IF;

  -- Penalidades
  IF (v_msg.hesitation->>'level') = 'alta' THEN v_score := v_score - 15; END IF;
  IF (v_msg.credibility->>'level') IN ('baixa','critica_spam') THEN v_score := v_score - 40; END IF;
  IF COALESCE(v_msg.quarantined, FALSE) THEN v_score := 0; END IF;

  -- Cap 0-100
  IF v_score < 0 THEN v_score := 0; END IF;
  IF v_score > 100 THEN v_score := 100; END IF;

  RETURN v_score;
END;
$fn$;
