CREATE OR REPLACE FUNCTION zapp_history.suggest_response_window(p_msg_time timestamp with time zone, p_lead_score integer, p_churn_risk text, p_sentiment text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
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
$function$
