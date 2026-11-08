CREATE OR REPLACE FUNCTION public.gerar_alertas_inativacao()
 RETURNS TABLE(alertas_criados integer, alertas_risco integer, alertas_criticos integer, alertas_inativar integer)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_dias_risco INTEGER;
    v_dias_critico INTEGER;
    v_dias_inativar INTEGER;
    v_count_risco INTEGER := 0;
    v_count_critico INTEGER := 0;
    v_count_inativar INTEGER := 0;
    v_total INTEGER := 0;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
    -- Buscar parâmetros
    SELECT COALESCE(valor::INTEGER, 150) INTO v_dias_risco 
    FROM config_regras_negocio WHERE chave = 'DIAS_ALERTA_INATIVACAO';
    
    SELECT COALESCE(valor::INTEGER, 165) INTO v_dias_critico 
    FROM config_regras_negocio WHERE chave = 'DIAS_ALERTA_CRITICO';
    
    SELECT COALESCE(valor::INTEGER, 180) INTO v_dias_inativar 
    FROM config_regras_negocio WHERE chave = 'DIAS_PARA_INATIVACAO';

    -- Expirar alertas antigos
    UPDATE alertas_inativacao
    SET status = 'EXPIRADO', updated_at = NOW()
    WHERE status = 'PENDENTE'
      AND data_referencia < CURRENT_DATE - INTERVAL '7 days';

    -- ALERTAS INATIVAR (180+ dias)
    INSERT INTO alertas_inativacao (
        customer_id, company_id, vendedor_id, vendedor_nome,
        tipo_alerta, severidade, dias_sem_compra, dias_para_inativar,
        valor_em_risco, titulo, mensagem, acao_sugerida
    )
    SELECT 
        cu.id, 
        cu.company_id, 
        cu.vendedor_id,  -- Pode ser NULL
        COALESCE(u.name, 'SEM VENDEDOR'),  -- Tratamento para NULL
        'INATIVAR', 
        1,
        (CURRENT_DATE - cu.data_ultima_compra)::INTEGER, 
        0,
        COALESCE(cu.valor_total_compras, 0),
        '🔴 INATIVAR: ' || c.title,
        'Cliente há ' || (CURRENT_DATE - cu.data_ultima_compra)::INTEGER || ' dias sem comprar. Passou do prazo de ' || v_dias_inativar || ' dias.',
        'Inativar ou contato urgente para recuperação'
    FROM customers cu
    JOIN companies c ON cu.company_id = c.id
    LEFT JOIN users u ON cu.vendedor_id = u.id
    WHERE cu.cliente_ativado = true
      AND cu.data_ultima_compra IS NOT NULL
      AND (CURRENT_DATE - cu.data_ultima_compra) >= v_dias_inativar
    ON CONFLICT (customer_id, tipo_alerta, data_referencia) DO NOTHING;
    GET DIAGNOSTICS v_count_inativar = ROW_COUNT;

    -- ALERTAS CRÍTICOS (165-179 dias)
    INSERT INTO alertas_inativacao (
        customer_id, company_id, vendedor_id, vendedor_nome,
        tipo_alerta, severidade, dias_sem_compra, dias_para_inativar,
        valor_em_risco, titulo, mensagem, acao_sugerida
    )
    SELECT 
        cu.id, 
        cu.company_id, 
        cu.vendedor_id,  -- Pode ser NULL
        COALESCE(u.name, 'SEM VENDEDOR'),  -- Tratamento para NULL
        'CRITICO', 
        2,
        (CURRENT_DATE - cu.data_ultima_compra)::INTEGER,
        v_dias_inativar - (CURRENT_DATE - cu.data_ultima_compra)::INTEGER,
        COALESCE(cu.valor_total_compras, 0),
        '🔴 CRÍTICO: ' || c.title,
        'URGENTE: Faltam ' || (v_dias_inativar - (CURRENT_DATE - cu.data_ultima_compra)::INTEGER) || ' dias para inativação!',
        'Ligar URGENTE para o cliente'
    FROM customers cu
    JOIN companies c ON cu.company_id = c.id
    LEFT JOIN users u ON cu.vendedor_id = u.id
    WHERE cu.cliente_ativado = true
      AND cu.data_ultima_compra IS NOT NULL
      AND (CURRENT_DATE - cu.data_ultima_compra) BETWEEN v_dias_critico AND (v_dias_inativar - 1)
    ON CONFLICT (customer_id, tipo_alerta, data_referencia) DO NOTHING;
    GET DIAGNOSTICS v_count_critico = ROW_COUNT;

    -- ALERTAS RISCO (150-164 dias)
    INSERT INTO alertas_inativacao (
        customer_id, company_id, vendedor_id, vendedor_nome,
        tipo_alerta, severidade, dias_sem_compra, dias_para_inativar,
        valor_em_risco, titulo, mensagem, acao_sugerida
    )
    SELECT 
        cu.id, 
        cu.company_id, 
        cu.vendedor_id,  -- Pode ser NULL
        COALESCE(u.name, 'SEM VENDEDOR'),  -- Tratamento para NULL
        'RISCO', 
        3,
        (CURRENT_DATE - cu.data_ultima_compra)::INTEGER,
        v_dias_inativar - (CURRENT_DATE - cu.data_ultima_compra)::INTEGER,
        COALESCE(cu.valor_total_compras, 0),
        '🟠 EM RISCO: ' || c.title,
        'Cliente há ' || (CURRENT_DATE - cu.data_ultima_compra)::INTEGER || ' dias sem comprar. ' || (v_dias_inativar - (CURRENT_DATE - cu.data_ultima_compra)::INTEGER) || ' dias para inativação.',
        'Agendar contato esta semana'
    FROM customers cu
    JOIN companies c ON cu.company_id = c.id
    LEFT JOIN users u ON cu.vendedor_id = u.id
    WHERE cu.cliente_ativado = true
      AND cu.data_ultima_compra IS NOT NULL
      AND (CURRENT_DATE - cu.data_ultima_compra) BETWEEN v_dias_risco AND (v_dias_critico - 1)
    ON CONFLICT (customer_id, tipo_alerta, data_referencia) DO NOTHING;
    GET DIAGNOSTICS v_count_risco = ROW_COUNT;

    v_total := v_count_risco + v_count_critico + v_count_inativar;
    RETURN QUERY SELECT v_total, v_count_risco, v_count_critico, v_count_inativar;
END;
$function$
