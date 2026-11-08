CREATE OR REPLACE FUNCTION public.atribuir_sdr_cliente(p_customer_id uuid, p_sdr_id integer, p_sdr_nome text)
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
    IF p_sdr_nome IS NULL OR TRIM(p_sdr_nome) = '' THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'sdr_nome é obrigatório');
    END IF;

    SELECT cu.*, c.id as company_id INTO v_customer
    FROM customers cu JOIN companies c ON cu.company_id = c.id
    WHERE cu.id = p_customer_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Cliente não encontrado');
    END IF;
    
    UPDATE customers SET sdr_id = p_sdr_id, sdr_nome = p_sdr_nome,
        data_atribuicao_sdr = CURRENT_DATE, updated_at = NOW()
    WHERE id = p_customer_id;
    
    INSERT INTO customer_sdr_history (customer_id, company_id, sdr_id, sdr_nome,
        data_inicio, data_atribuicao, resultado, qtd_tentativas_contato, qtd_conversas, created_at, updated_at)
    VALUES (p_customer_id, v_customer.company_id, p_sdr_id, p_sdr_nome,
        CURRENT_DATE, CURRENT_DATE, 'EM_ANDAMENTO', 0, 0, NOW(), NOW());
    
    INSERT INTO customer_events (customer_id, company_id, evento_tipo, data_evento, dados_extras)
    VALUES (p_customer_id, v_customer.company_id, 'ATRIBUIDO_SDR', CURRENT_DATE,
        jsonb_build_object('sdr_id', p_sdr_id, 'sdr_nome', p_sdr_nome));
    
    RETURN jsonb_build_object('status', 'success', 'message', 'SDR atribuído com sucesso',
        'customer_id', p_customer_id, 'sdr_id', p_sdr_id, 'sdr_nome', p_sdr_nome);
END;
$function$
