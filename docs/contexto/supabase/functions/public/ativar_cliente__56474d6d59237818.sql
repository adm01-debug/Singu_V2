CREATE OR REPLACE FUNCTION public.ativar_cliente(p_customer_id uuid, p_executado_por_id integer DEFAULT NULL::integer, p_executado_por_nome text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_customer RECORD;
    v_is_reativacao BOOLEAN;
    v_tipo_evento TEXT;
BEGIN
  PERFORM public.assert_customer_access(p_customer_id);
    IF p_customer_id IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'customer_id é obrigatório');
    END IF;

    SELECT cu.*, c.id as company_id INTO v_customer
    FROM customers cu JOIN companies c ON cu.company_id = c.id
    WHERE cu.id = p_customer_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Cliente não encontrado');
    END IF;
    
    IF v_customer.cliente_ativado = true THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Cliente já está ativo');
    END IF;
    
    v_is_reativacao := v_customer.data_primeira_ativacao IS NOT NULL;
    v_tipo_evento := CASE WHEN v_is_reativacao THEN 'REATIVACAO' ELSE 'ATIVACAO' END;
    
    UPDATE customers SET cliente_ativado = true, data_ativacao = CURRENT_DATE,
        ativado_por = COALESCE(p_executado_por_nome, 'Sistema'),
        data_primeira_ativacao = COALESCE(data_primeira_ativacao, CURRENT_DATE),
        primeiro_ativador_id = COALESCE(primeiro_ativador_id, p_executado_por_id),
        primeiro_ativador_nome = COALESCE(primeiro_ativador_nome, p_executado_por_nome, 'Sistema'),
        data_inativacao = NULL, inativado_por_id = NULL, inativado_por_nome = NULL,
        motivo_inativacao = NULL, updated_at = NOW()
    WHERE id = p_customer_id;
    
    INSERT INTO customer_events (customer_id, company_id, evento_tipo, data_evento,
        executado_por_id, executado_por_nome)
    VALUES (p_customer_id, v_customer.company_id, v_tipo_evento, CURRENT_DATE,
        p_executado_por_id, COALESCE(p_executado_por_nome, 'Sistema'));
    
    RETURN jsonb_build_object('status', 'success', 'message', 'Cliente ativado com sucesso',
        'customer_id', p_customer_id, 'tipo', v_tipo_evento);
END;
$function$
