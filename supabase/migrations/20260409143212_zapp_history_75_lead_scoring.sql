-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409143212
-- nome:   zapp_history_75_lead_scoring

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS lead_score INTEGER,
  ADD COLUMN IF NOT EXISTS lead_score_breakdown JSONB;

CREATE INDEX IF NOT EXISTS idx_messages_lead_score
  ON zapp_history.messages(lead_score DESC NULLS LAST)
  WHERE lead_score IS NOT NULL;

-- Calcula lead score 0-100 a partir dos sinais detectados
CREATE OR REPLACE FUNCTION zapp_history.calculate_lead_score(p_message_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE
  v_msg zapp_history.messages%ROWTYPE;
  v_score INTEGER := 0;
  v_breakdown JSONB := '{}'::jsonb;
  v_qty INTEGER;
BEGIN
  SELECT * INTO v_msg FROM zapp_history.messages WHERE id = p_message_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- +30 pts: tem produto identificado
  IF v_msg.nlp_structured_order ? 'product' THEN
    v_score := v_score + 30;
    v_breakdown := v_breakdown || jsonb_build_object('produto_identificado', 30);
  END IF;

  -- +20 pts: tem quantidade
  IF v_msg.nlp_structured_order ? 'quantity' THEN
    v_qty := (v_msg.nlp_structured_order->>'quantity')::INTEGER;
    v_score := v_score + 20;
    v_breakdown := v_breakdown || jsonb_build_object('quantidade', 20);

    -- +10 pts extras: pedido grande (>500)
    IF v_qty >= 500 THEN
      v_score := v_score + 10;
      v_breakdown := v_breakdown || jsonb_build_object('pedido_grande', 10);
    END IF;

    -- +5 pts: pedido enorme (>2000)
    IF v_qty >= 2000 THEN
      v_score := v_score + 5;
      v_breakdown := v_breakdown || jsonb_build_object('pedido_enorme', 5);
    END IF;
  END IF;

  -- +15 pts: tem deadline (intenção real)
  IF v_msg.nlp_structured_order ? 'deadline' THEN
    v_score := v_score + 15;
    v_breakdown := v_breakdown || jsonb_build_object('com_deadline', 15);
  END IF;

  -- +20 pts: urgente
  IF v_msg.nlp_sentiment = 'urgent' THEN
    v_score := v_score + 20;
    v_breakdown := v_breakdown || jsonb_build_object('urgente', 20);
  END IF;

  -- +25 pts: tem CNPJ (lead B2B qualificado)
  IF v_msg.nlp_structured_order ? 'cnpj' THEN
    v_score := v_score + 25;
    v_breakdown := v_breakdown || jsonb_build_object('cnpj_b2b', 25);
  END IF;

  -- Cap em 100
  IF v_score > 100 THEN v_score := 100; END IF;

  UPDATE zapp_history.messages
  SET lead_score = v_score,
      lead_score_breakdown = v_breakdown
  WHERE id = p_message_id;

  RETURN v_score;
END;
$fn$;

-- Trigger que calcula score automaticamente após NLP
CREATE OR REPLACE FUNCTION zapp_history.trg_calculate_lead_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  PERFORM zapp_history.calculate_lead_score(NEW.id);
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_lead_score_calc ON zapp_history.messages;
CREATE TRIGGER trg_lead_score_calc
  AFTER UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.trg_calculate_lead_score();
