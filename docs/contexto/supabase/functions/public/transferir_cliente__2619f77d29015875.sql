CREATE OR REPLACE FUNCTION public.transferir_cliente(p_customer_id uuid, p_novo_vendedor_id integer, p_novo_vendedor_nome text, p_executado_por_id integer DEFAULT NULL::integer, p_executado_por_nome text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_customer RECORD;
    v_vendedor_anterior_id INTEGER;
    v_vendedor_anterior_nome TEXT;
BEGIN
  PERFORM public.assert_customer_access(p_customer_id);
    -- Buscar customer
    SELECT cu.*, c.id as company_id 
    INTO v_customer
    FROM customers cu
    JOIN companies c ON cu.company_id = c.id
    WHERE cu.id = p_customer_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Cliente não encontrado');
    END IF;
    
    -- Guardar vendedor anterior
    v_vendedor_anterior_id := v_customer.vendedor_id;
    v_vendedor_anterior_nome := v_customer.vendedor_nome;
    
    -- VALIDAÇÃO: Não transferir para o mesmo vendedor
    IF v_vendedor_anterior_id = p_novo_vendedor_id THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Cliente já pertence a este vendedor'
        );
    END IF;
    
    -- Fechar registro anterior no histórico (se existir)
    UPDATE customer_ownership_history SET
        data_fim = CURRENT_DATE,
        motivo_saida = 'TRANSFERENCIA',
        updated_at = NOW()
    WHERE customer_id = p_customer_id 
    AND data_fim IS NULL;
    
    -- Atualizar customer
    UPDATE customers SET
        vendedor_id = p_novo_vendedor_id,
        vendedor_nome = p_novo_vendedor_nome,
        updated_at = NOW()
    WHERE id = p_customer_id;
    
    -- Criar novo registro no histórico
    INSERT INTO customer_ownership_history (
        customer_id, company_id, vendedor_id, vendedor_nome,
        data_inicio, motivo_entrada,
        registrado_por_id, registrado_por_nome, created_at, updated_at
    ) VALUES (
        p_customer_id, v_customer.company_id, p_novo_vendedor_id, p_novo_vendedor_nome,
        CURRENT_DATE, 'TRANSFERENCIA',
        p_executado_por_id, p_executado_por_nome, NOW(), NOW()
    );
    
    -- Registrar evento
    INSERT INTO customer_events (
        customer_id, company_id, evento_tipo, data_evento,
        vendedor_id, vendedor_nome, executado_por_id, executado_por_nome,
        dados_extras
    ) VALUES (
        p_customer_id, v_customer.company_id, 'TRANSFERENCIA', CURRENT_DATE,
        p_novo_vendedor_id, p_novo_vendedor_nome, p_executado_por_id, p_executado_por_nome,
        jsonb_build_object('vendedor_anterior_id', v_vendedor_anterior_id, 'vendedor_anterior_nome', v_vendedor_anterior_nome)
    );
    
    RETURN jsonb_build_object(
        'status', 'success',
        'message', 'Cliente transferido com sucesso',
        'customer_id', p_customer_id,
        'de', v_vendedor_anterior_nome,
        'para', p_novo_vendedor_nome
    );
END;
$function$
