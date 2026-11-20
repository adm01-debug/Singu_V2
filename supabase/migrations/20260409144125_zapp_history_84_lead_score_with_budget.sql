-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409144125
-- nome:   zapp_history_84_lead_score_with_budget

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

  IF v_msg.nlp_structured_order ? 'product' THEN
    v_score := v_score + 25;
    v_breakdown := v_breakdown || jsonb_build_object('produto_identificado', 25);
  END IF;

  IF v_msg.nlp_structured_order ? 'quantity' THEN
    v_qty := (v_msg.nlp_structured_order->>'quantity')::INTEGER;
    v_score := v_score + 15;
    v_breakdown := v_breakdown || jsonb_build_object('quantidade', 15);

    IF v_qty >= 500 THEN
      v_score := v_score + 10;
      v_breakdown := v_breakdown || jsonb_build_object('pedido_grande_500plus', 10);
    END IF;

    IF v_qty >= 2000 THEN
      v_score := v_score + 5;
      v_breakdown := v_breakdown || jsonb_build_object('pedido_enorme_2000plus', 5);
    END IF;
  END IF;

  IF v_msg.nlp_structured_order ? 'deadline' THEN
    v_score := v_score + 10;
    v_breakdown := v_breakdown || jsonb_build_object('com_deadline', 10);
  END IF;

  IF v_msg.nlp_sentiment = 'urgent' THEN
    v_score := v_score + 15;
    v_breakdown := v_breakdown || jsonb_build_object('urgente', 15);
  END IF;

  IF v_msg.nlp_structured_order ? 'cnpj' THEN
    v_score := v_score + 20;
    v_breakdown := v_breakdown || jsonb_build_object('cnpj_b2b', 20);
  END IF;

  -- NOVO: budget declarado é forte sinal de intenção real
  IF v_msg.budget_detected IS NOT NULL THEN
    v_score := v_score + 15;
    v_breakdown := v_breakdown || jsonb_build_object('budget_declarado', 15);

    IF v_msg.budget_detected >= 5000 THEN
      v_score := v_score + 5;
      v_breakdown := v_breakdown || jsonb_build_object('budget_alto', 5);
    END IF;
  END IF;

  -- NOVO: cliente recorrente já validou
  IF v_msg.discovery_channel = 'cliente_recorrente' THEN
    v_score := v_score + 10;
    v_breakdown := v_breakdown || jsonb_build_object('cliente_recorrente', 10);
  END IF;

  IF v_score > 100 THEN v_score := 100; END IF;

  UPDATE zapp_history.messages
  SET lead_score = v_score, lead_score_breakdown = v_breakdown
  WHERE id = p_message_id;

  RETURN v_score;
END;
$fn$;
