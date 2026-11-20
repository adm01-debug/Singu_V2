-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121540
-- nome:   create_fn_homologar_carrier

CREATE OR REPLACE FUNCTION fn_homologar_carrier(
  p_carrier_id uuid,
  p_avaliador_id integer,
  p_status text DEFAULT 'homologado',
  p_criterios jsonb DEFAULT '{}',
  p_observacoes text DEFAULT NULL,
  p_motivo_reprovacao text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_result JSON;
  v_carrier_exists BOOLEAN;
  v_avaliador_logistica BOOLEAN;
  v_hom_id UUID;
BEGIN
  -- Validação 1: carrier existe?
  SELECT EXISTS(SELECT 1 FROM carriers WHERE id = p_carrier_id) INTO v_carrier_exists;
  IF NOT v_carrier_exists THEN
    RETURN json_build_object('success', false, 'error', 'Transportadora não encontrada');
  END IF;

  -- Validação 2: avaliador é do departamento Logística? (D2: Thiago/Logística)
  SELECT EXISTS(
    SELECT 1 FROM users WHERE id = p_avaliador_id AND departamento = 'Logística' AND is_active = true
  ) INTO v_avaliador_logistica;
  IF NOT v_avaliador_logistica THEN
    RETURN json_build_object('success', false, 'error', 'Avaliador não pertence ao departamento de Logística ou está inativo');
  END IF;

  -- Validação 3: status válido?
  IF p_status NOT IN ('pendente','em_analise','homologado','reprovado','suspenso') THEN
    RETURN json_build_object('success', false, 'error', 'Status inválido. Use: pendente, em_analise, homologado, reprovado, suspenso');
  END IF;

  -- Validação 4: reprovação precisa de motivo
  IF p_status = 'reprovado' AND (p_motivo_reprovacao IS NULL OR p_motivo_reprovacao = '') THEN
    RETURN json_build_object('success', false, 'error', 'Reprovação exige motivo');
  END IF;

  -- Inserir homologação (trigger cuida de atualizar carriers.homologado)
  INSERT INTO carrier_homologations (carrier_id, status, avaliador_id, criterios_checados, observacoes, motivo_reprovacao)
  VALUES (p_carrier_id, p_status::carrier_homologation_status, p_avaliador_id, p_criterios, p_observacoes, p_motivo_reprovacao)
  RETURNING id INTO v_hom_id;

  SELECT json_build_object(
    'success', true,
    'homologation_id', v_hom_id,
    'carrier_id', p_carrier_id,
    'status', p_status,
    'avaliador', (SELECT name FROM users WHERE id = p_avaliador_id),
    'validade', (SELECT validade FROM carrier_homologations WHERE id = v_hom_id)
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

COMMENT ON FUNCTION fn_homologar_carrier(uuid, integer, text, jsonb, text, text) IS 'Homologa transportadora. Apenas departamento Logística pode homologar. Reprovação exige motivo.';
