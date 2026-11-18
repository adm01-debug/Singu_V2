-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329182111
-- nome:   create_fn_homologar_fornecedor

CREATE OR REPLACE FUNCTION fn_homologar_fornecedor(
  p_supplier_id UUID,
  p_avaliador_id INTEGER,
  p_status TEXT DEFAULT 'homologado',
  p_criterios JSONB DEFAULT '{}',
  p_observacoes TEXT DEFAULT NULL,
  p_motivo_reprovacao TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_supplier_exists BOOLEAN;
  v_avaliador_compras BOOLEAN;
  v_hom_id UUID;
BEGIN
  -- Validação 1: supplier existe?
  SELECT EXISTS(SELECT 1 FROM suppliers WHERE id = p_supplier_id) INTO v_supplier_exists;
  IF NOT v_supplier_exists THEN
    RETURN json_build_object('success', false, 'error', 'Fornecedor não encontrado');
  END IF;

  -- Validação 2: avaliador é do departamento Compras?
  SELECT EXISTS(
    SELECT 1 FROM users WHERE id = p_avaliador_id AND departamento = 'Compras' AND is_active = true
  ) INTO v_avaliador_compras;
  IF NOT v_avaliador_compras THEN
    RETURN json_build_object('success', false, 'error', 'Avaliador não pertence ao departamento de Compras ou está inativo');
  END IF;

  -- Validação 3: status válido?
  IF p_status NOT IN ('pendente','em_analise','homologado','reprovado','suspenso') THEN
    RETURN json_build_object('success', false, 'error', 'Status inválido. Use: pendente, em_analise, homologado, reprovado, suspenso');
  END IF;

  -- Validação 4: reprovação precisa de motivo
  IF p_status = 'reprovado' AND (p_motivo_reprovacao IS NULL OR p_motivo_reprovacao = '') THEN
    RETURN json_build_object('success', false, 'error', 'Reprovação exige motivo');
  END IF;

  -- Inserir homologação (trigger cuida de atualizar suppliers.homologado)
  INSERT INTO supplier_homologations (supplier_id, status, avaliador_id, criterios_checados, observacoes, motivo_reprovacao)
  VALUES (p_supplier_id, p_status::supplier_homologation_status, p_avaliador_id, p_criterios, p_observacoes, p_motivo_reprovacao)
  RETURNING id INTO v_hom_id;

  SELECT json_build_object(
    'success', true,
    'homologation_id', v_hom_id,
    'supplier_id', p_supplier_id,
    'status', p_status,
    'avaliador', (SELECT name FROM users WHERE id = p_avaliador_id),
    'validade', (SELECT validade FROM supplier_homologations WHERE id = v_hom_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_homologar_fornecedor IS 
'Homologa/reprova fornecedor com validações de segurança.
Params: supplier_id, avaliador_id (deve ser Compras), status, critérios (jsonb), observações, motivo reprovação.
Trigger automático atualiza suppliers.homologado e calcula validade.';
