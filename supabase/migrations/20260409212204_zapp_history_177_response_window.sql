-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409212204
-- nome:   zapp_history_177_response_window

-- Função: dado o horário e perfil, sugere a janela ideal de resposta
CREATE OR REPLACE FUNCTION zapp_history.suggest_response_window(p_msg_time TIMESTAMPTZ, p_lead_score INT, p_churn_risk TEXT, p_sentiment TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_local TIMESTAMPTZ;
  v_hour INT;
  v_dow INT;
  v_target_minutes INT;
  v_target_at TIMESTAMPTZ;
  v_label TEXT;
BEGIN
  v_local := p_msg_time AT TIME ZONE 'America/Sao_Paulo';
  v_hour := EXTRACT(HOUR FROM v_local);
  v_dow := EXTRACT(DOW FROM v_local);

  -- Churn crítico ou urgent: < 5 min
  IF p_churn_risk IN ('alto','critico') OR p_sentiment = 'urgent' THEN
    v_target_minutes := 5;
    v_label := '⛔ < 5 minutos (critico)';
  -- Lead HOT: < 15 min
  ELSIF COALESCE(p_lead_score, 0) >= 80 THEN
    v_target_minutes := 15;
    v_label := '🔥 < 15 minutos (lead hot)';
  -- Lead WARM: < 1h
  ELSIF COALESCE(p_lead_score, 0) >= 60 THEN
    v_target_minutes := 60;
    v_label := '🌶️ < 1 hora (lead warm)';
  -- Lead LUKEWARM: < 4h
  ELSIF COALESCE(p_lead_score, 0) >= 40 THEN
    v_target_minutes := 240;
    v_label := '💧 < 4 horas (lead lukewarm)';
  -- Cold: até fim do dia comercial
  ELSE
    v_target_minutes := 480;
    v_label := '❄️ < 8 horas (lead cold)';
  END IF;

  v_target_at := p_msg_time + (v_target_minutes || ' minutes')::interval;

  -- Se cair fora do horário comercial, empurra pro próximo horário comercial
  IF (v_dow BETWEEN 1 AND 5) AND v_hour >= 18 THEN
    v_target_at := date_trunc('day', p_msg_time + INTERVAL '1 day') + INTERVAL '8 hours';
    v_label := v_label || ' (fora horário, próximo dia 8h)';
  ELSIF v_dow IN (0,6) THEN
    v_target_at := date_trunc('week', p_msg_time + INTERVAL '7 days') + INTERVAL '8 hours';
    v_label := v_label || ' (fim de semana, próxima segunda 8h)';
  END IF;

  RETURN jsonb_build_object(
    'target_minutes', v_target_minutes,
    'target_at', v_target_at,
    'label', v_label
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.suggest_response_window(TIMESTAMPTZ, INT, TEXT, TEXT) TO authenticated, service_role;

-- Adiciona coluna calculada na tabela
ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS suggested_response_at TIMESTAMPTZ;
ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS suggested_response_label TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_suggested_response ON zapp_history.messages(suggested_response_at)
  WHERE suggested_response_at IS NOT NULL;

-- Trigger
CREATE OR REPLACE FUNCTION zapp_history.trg_set_response_window()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE v_window JSONB;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.direction <> 'inbound' THEN RETURN NEW; END IF;

  v_window := zapp_history.suggest_response_window(
    NEW.created_at, NEW.lead_score, NEW.churn_risk->>'risk', NEW.nlp_sentiment
  );

  UPDATE zapp_history.messages
  SET suggested_response_at = (v_window->>'target_at')::TIMESTAMPTZ,
      suggested_response_label = v_window->>'label'
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS zzz2_trg_response_window ON zapp_history.messages;
CREATE TRIGGER zzz2_trg_response_window
  AFTER UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.trg_set_response_window();
