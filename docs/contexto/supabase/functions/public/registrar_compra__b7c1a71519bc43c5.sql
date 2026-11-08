CREATE OR REPLACE FUNCTION public.registrar_compra(p_customer_id uuid, p_valor numeric, p_numero_pedido text DEFAULT NULL::text, p_observacoes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_customer RECORD;
    v_is_primeira_compra BOOLEAN;
    v_novo_total DECIMAL;
    v_novo_total_pedidos INTEGER;
    v_tipo_evento TEXT;
BEGIN
  PERFORM public.assert_customer_access(p_customer_id);
    -- ⚠️ NOVA VALIDAÇÃO: Valor deve ser positivo
    IF p_valor IS NULL OR p_valor <= 0 THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Valor deve ser maior que zero'
        );
    END IF;

    -- Buscar customer
    SELECT cu.*, c.id as company_id 
    INTO v_customer
    FROM customers cu
    JOIN companies c ON cu.company_id = c.id
    WHERE cu.id = p_customer_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Cliente não encontrado');
    END IF;
    
    -- Verificar se é primeira compra
    v_is_primeira_compra := NOT v_customer.ja_comprou;
    v_tipo_evento := CASE WHEN v_is_primeira_compra THEN 'PRIMEIRA_COMPRA' ELSE 'COMPRA' END;
    
    -- Calcular novos totais
    v_novo_total := COALESCE(v_customer.valor_total_compras, 0) + p_valor;
    v_novo_total_pedidos := COALESCE(v_customer.total_pedidos, 0) + 1;
    
    -- Atualizar customer
    UPDATE customers SET
        ja_comprou = true,
        data_ultima_compra = CURRENT_DATE,
        data_primeira_compra = COALESCE(data_primeira_compra, CURRENT_DATE),
        valor_total_compras = v_novo_total,
        total_pedidos = v_novo_total_pedidos,
        ticket_medio = v_novo_total / v_novo_total_pedidos,
        updated_at = NOW()
    WHERE id = p_customer_id;
    
    -- Registrar evento
    INSERT INTO customer_events (
        customer_id, company_id, evento_tipo, data_evento,
        vendedor_id, vendedor_nome, observacoes, dados_extras
    ) VALUES (
        p_customer_id, v_customer.company_id, v_tipo_evento, CURRENT_DATE,
        v_customer.vendedor_id, v_customer.vendedor_nome, p_observacoes,
        jsonb_build_object('numero_pedido', p_numero_pedido, 'valor', p_valor)
    );
    
    RETURN jsonb_build_object(
        'status', 'success',
        'message', CASE WHEN v_is_primeira_compra THEN 'Primeira compra registrada!' ELSE 'Compra registrada' END,
        'customer_id', p_customer_id,
        'valor', p_valor,
        'valor_total', v_novo_total,
        'total_pedidos', v_novo_total_pedidos
    );
END;
$function$
