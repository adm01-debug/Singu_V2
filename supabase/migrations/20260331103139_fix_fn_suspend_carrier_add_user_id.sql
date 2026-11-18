-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260331103139
-- nome:   fix_fn_suspend_carrier_add_user_id

CREATE OR REPLACE FUNCTION fn_suspend_carrier(p_carrier_id uuid, p_avaliador_id integer, p_motivo text)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_hom_id UUID;
  v_company_id UUID;
  v_nome TEXT;
  v_system_user_id UUID;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM carriers WHERE id = p_carrier_id) THEN
    RETURN json_build_object('success', false, 'error', 'Transportadora não encontrada');
  END IF;
  IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_avaliador_id AND departamento = 'Logística' AND is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Apenas Logística pode suspender transportadora');
  END IF;
  IF p_motivo IS NULL OR p_motivo = '' THEN
    RETURN json_build_object('success', false, 'error', 'Suspensão exige motivo');
  END IF;

  -- FIX B1: Buscar SYSTEM_ALERT_USER_ID com COALESCE duplo
  SELECT COALESCE(valor::uuid, '0b7c504d-b3d9-4144-b6b5-40a57b84feef'::uuid) INTO v_system_user_id
  FROM config_regras_negocio WHERE chave = 'SYSTEM_ALERT_USER_ID';
  IF v_system_user_id IS NULL THEN v_system_user_id := '0b7c504d-b3d9-4144-b6b5-40a57b84feef'::uuid; END IF;

  SELECT c.company_id, co.nome_crm INTO v_company_id, v_nome
  FROM carriers c JOIN companies co ON co.id = c.company_id WHERE c.id = p_carrier_id;

  INSERT INTO carrier_homologations (carrier_id, status, avaliador_id, motivo_reprovacao, observacoes)
  VALUES (p_carrier_id, 'suspenso', p_avaliador_id, p_motivo, 'Suspensão ativa')
  RETURNING id INTO v_hom_id;

  -- FIX B1: Incluir user_id no INSERT
  INSERT INTO alerts (id, user_id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
  VALUES (gen_random_uuid(), v_system_user_id, v_company_id, 'carrier_nao_homologado', 'critical',
    'Transportadora Suspensa: ' || v_nome,
    'A transportadora ' || v_nome || ' foi SUSPENSA. Motivo: ' || p_motivo || '. Nenhum novo envio deve ser realizado.',
    'pending',
    jsonb_build_object('carrier_id', p_carrier_id, 'homologation_id', v_hom_id, 'motivo', p_motivo),
    NOW(), NOW());

  RETURN json_build_object('success', true, 'carrier_id', p_carrier_id, 'status', 'suspenso', 'motivo', p_motivo);
END;
$function$;

COMMENT ON FUNCTION fn_suspend_carrier(uuid, integer, text) IS 'Suspende transportadora. Apenas Logística. Motivo obrigatório. Gera alerta critical. FIX B1: user_id incluído.';
