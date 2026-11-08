CREATE OR REPLACE FUNCTION public.inativar_cliente(p_customer_id uuid, p_motivo text, p_executado_por_id integer DEFAULT NULL::integer, p_executado_por_nome text DEFAULT NULL::text)
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
    IF p_motivo IS NULL OR TRIM(p_motivo) = '' THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'motivo é obrigatório');
    END IF;

    SELECT cu.*, c.id as company_id INTO v_customer
    FROM customers cu JOIN companies c ON cu.company_id = c.id
    WHERE cu.id = p_customer_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Cliente não encontrado');
    END IF;
    
    IF v_customer.cliente_ativado = false THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Cliente já está inativo');
    END IF;
    
    UPDATE customer_ownership_history SET data_fim = CURRENT_DATE, motivo_saida = 'INATIVACAO', updated_at = NOW()
    WHERE customer_id = p_customer_id AND data_fim IS NULL;
    
    UPDATE customers SET cliente_ativado = false, data_inativacao = CURRENT_DATE,
        inativado_por_id = p_executado_por_id, inativado_por_nome = COALESCE(p_executado_por_nome, 'Sistema'),
        motivo_inativacao = p_motivo, updated_at = NOW()
    WHERE id = p_customer_id;
    
    INSERT INTO customer_events (customer_id, company_id, evento_tipo, data_evento,
        executado_por_id, executado_por_nome, motivo)
    VALUES (p_customer_id, v_customer.company_id, 'INATIVACAO', CURRENT_DATE,
        p_executado_por_id, COALESCE(p_executado_por_nome, 'Sistema'), p_motivo);
    
    RETURN jsonb_build_object('status', 'success', 'message', 'Cliente inativado com sucesso',
        'customer_id', p_customer_id, 'motivo', p_motivo);
END;
$function$
