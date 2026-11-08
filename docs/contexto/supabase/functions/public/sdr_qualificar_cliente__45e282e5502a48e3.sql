CREATE OR REPLACE FUNCTION public.sdr_qualificar_cliente(p_customer_id uuid, p_sdr_id integer, p_closer_id integer, p_closer_nome text, p_observacoes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_customer RECORD;
BEGIN
  PERFORM public.assert_customer_access(p_customer_id);
    IF p_customer_id IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'customer_id é obrigatório');
    END IF;
    IF p_sdr_id IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'sdr_id é obrigatório');
    END IF;
    IF p_closer_id IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'closer_id é obrigatório');
    END IF;
    IF p_closer_nome IS NULL OR TRIM(p_closer_nome) = '' THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'closer_nome é obrigatório');
    END IF;

    SELECT cu.*, c.id as company_id INTO v_customer
    FROM customers cu JOIN companies c ON cu.company_id = c.id
    WHERE cu.id = p_customer_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Cliente não encontrado');
    END IF;
    
    UPDATE customer_sdr_history SET data_fim = CURRENT_DATE, resultado = 'QUALIFICADO',
        data_passagem_closer = CURRENT_DATE, passed_to_closer_id = p_closer_id,
        passed_to_closer_nome = p_closer_nome, observacoes = p_observacoes, updated_at = NOW()
    WHERE customer_id = p_customer_id AND sdr_id = p_sdr_id AND data_fim IS NULL;
    
    UPDATE customers SET vendedor_id = p_closer_id, vendedor_nome = p_closer_nome,
        sdr_id = NULL, sdr_nome = NULL, updated_at = NOW()
    WHERE id = p_customer_id;
    
    INSERT INTO customer_ownership_history (customer_id, company_id, vendedor_id, vendedor_nome,
        data_inicio, motivo_entrada, created_at, updated_at)
    VALUES (p_customer_id, v_customer.company_id, p_closer_id, p_closer_nome,
        CURRENT_DATE, 'PROSPECCAO_SDR', NOW(), NOW());
    
    INSERT INTO customer_events (customer_id, company_id, evento_tipo, data_evento, dados_extras, observacoes)
    VALUES (p_customer_id, v_customer.company_id, 'QUALIFICADO_SDR', CURRENT_DATE,
        jsonb_build_object('sdr_id', p_sdr_id, 'closer_id', p_closer_id, 'closer_nome', p_closer_nome), p_observacoes);
    
    RETURN jsonb_build_object('status', 'success', 'message', 'Cliente qualificado e passado para closer',
        'customer_id', p_customer_id, 'closer_id', p_closer_id, 'closer_nome', p_closer_nome);
END;
$function$
