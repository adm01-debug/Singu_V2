CREATE OR REPLACE FUNCTION zapp_history.detect_relationship_status(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
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
$function$
