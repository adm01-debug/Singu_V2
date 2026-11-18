-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409174349
-- nome:   zapp_history_101_response_time_sla

ALTER TABLE zapp_history.conversations
  ADD COLUMN IF NOT EXISTS first_inbound_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_outbound_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_response_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS avg_response_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS sla_status TEXT;

CREATE INDEX IF NOT EXISTS idx_conv_first_response ON zapp_history.conversations(first_response_seconds);
CREATE INDEX IF NOT EXISTS idx_conv_sla_status ON zapp_history.conversations(sla_status);

CREATE OR REPLACE FUNCTION zapp_history.trg_update_response_time()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
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
$fn$;

DROP TRIGGER IF EXISTS trg_response_time_calc ON zapp_history.messages;
CREATE TRIGGER trg_response_time_calc
  AFTER INSERT ON zapp_history.messages
  FOR EACH ROW
  EXECUTE FUNCTION zapp_history.trg_update_response_time();
