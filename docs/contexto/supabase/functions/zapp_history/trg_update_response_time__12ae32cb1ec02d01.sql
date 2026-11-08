CREATE OR REPLACE FUNCTION zapp_history.trg_update_response_time()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_first_in TIMESTAMPTZ;
  v_first_out TIMESTAMPTZ;
  v_diff_sec INTEGER;
  v_avg INTEGER;
  v_sla TEXT;
BEGIN
  -- Atualiza timestamps na conversa
  IF NEW.direction = 'inbound' THEN
    UPDATE zapp_history.conversations
    SET first_inbound_at = COALESCE(first_inbound_at, NEW.created_at)
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE zapp_history.conversations
    SET first_outbound_at = COALESCE(first_outbound_at, NEW.created_at)
    WHERE id = NEW.conversation_id;
  END IF;

  -- Calcula primeira resposta se ambos existem
  SELECT first_inbound_at, first_outbound_at INTO v_first_in, v_first_out
  FROM zapp_history.conversations WHERE id = NEW.conversation_id;

  IF v_first_in IS NOT NULL AND v_first_out IS NOT NULL AND v_first_out > v_first_in THEN
    v_diff_sec := EXTRACT(EPOCH FROM (v_first_out - v_first_in))::INTEGER;

    -- SLA classification
    v_sla := CASE
      WHEN v_diff_sec <= 300    THEN '🟢 EXCELENTE (≤5min)'
      WHEN v_diff_sec <= 1800   THEN '🟡 BOM (≤30min)'
      WHEN v_diff_sec <= 3600   THEN '🟠 ACEITAVEL (≤1h)'
      WHEN v_diff_sec <= 14400  THEN '🔴 LENTO (≤4h)'
      ELSE '⛔ CRITICO (>4h)'
    END;

    -- Avg de todas as respostas (aproximação: conta intervalo médio entre direções)
    SELECT AVG(EXTRACT(EPOCH FROM (m2.created_at - m1.created_at))::INTEGER)::INTEGER
    INTO v_avg
    FROM zapp_history.messages m1
    JOIN zapp_history.messages m2 ON m2.conversation_id = m1.conversation_id
      AND m2.created_at > m1.created_at
      AND m2.direction <> m1.direction
    WHERE m1.conversation_id = NEW.conversation_id;

    UPDATE zapp_history.conversations
    SET first_response_seconds = v_diff_sec,
        avg_response_seconds = v_avg,
        sla_status = v_sla
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$
