-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409222232
-- nome:   zapp_history_193_relationship_status

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
BEGIN
  IF p_contact_id IS NULL THEN RETURN jsonb_build_object('status','unknown'); END IF;

  SELECT COUNT(*), MIN(created_at), MAX(created_at)
  INTO v_total, v_first_msg, v_last_msg
  FROM zapp_history.messages
  WHERE contact_id = p_contact_id AND direction = 'inbound';

  IF v_total IS NULL OR v_total = 0 THEN
    RETURN jsonb_build_object('status','novo','total_msgs',0);
  END IF;

  v_days_since_first := EXTRACT(DAY FROM (NOW() - v_first_msg))::INT;
  v_days_since_last := EXTRACT(DAY FROM (NOW() - v_last_msg))::INT;

  IF v_total = 1 AND v_days_since_first <= 1 THEN
    v_status := 'novo';
    v_label := '🆕 Primeiro contato';
  ELSIF v_total <= 3 AND v_days_since_first <= 7 THEN
    v_status := 'iniciante';
    v_label := '🌱 Iniciando relacionamento';
  ELSIF v_days_since_last > 90 THEN
    v_status := 'retornante';
    v_label := '🔄 Retornou após ' || v_days_since_last || ' dias';
  ELSIF v_total >= 20 AND v_days_since_last <= 30 THEN
    v_status := 'recorrente_alto';
    v_label := '⭐ Cliente recorrente ativo (' || v_total || ' interações)';
  ELSIF v_total >= 5 THEN
    v_status := 'recorrente';
    v_label := '🤝 Cliente recorrente (' || v_total || ' interações)';
  ELSE
    v_status := 'em_desenvolvimento';
    v_label := '📈 Em desenvolvimento';
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'label', v_label,
    'total_msgs', v_total,
    'days_since_first', v_days_since_first,
    'days_since_last', v_days_since_last,
    'first_contact', v_first_msg,
    'last_contact', v_last_msg
  );
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS relationship_status JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_rel_status ON zapp_history.messages((relationship_status->>'status'))
  WHERE relationship_status IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_relationship_status(UUID) TO authenticated, service_role;
