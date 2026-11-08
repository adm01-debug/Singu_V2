CREATE OR REPLACE FUNCTION public.resolver_alerta_inativacao(p_alerta_id uuid, p_status text DEFAULT 'RESOLVIDO'::text, p_resolvido_por_id integer DEFAULT NULL::integer, p_resolvido_por_nome text DEFAULT NULL::text, p_observacao text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_alerta alertas_inativacao%ROWTYPE;
BEGIN
    -- Validar status
    IF p_status NOT IN ('VISTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'IGNORADO') THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Status inválido. Use: VISTO, EM_ANDAMENTO, RESOLVIDO ou IGNORADO');
    END IF;

    -- Buscar alerta
    SELECT * INTO v_alerta FROM alertas_inativacao WHERE id = p_alerta_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Alerta não encontrado');
    END IF;

    -- Atualizar alerta
    UPDATE alertas_inativacao
    SET 
        status = p_status,
        resolvido_em = CASE WHEN p_status IN ('RESOLVIDO', 'IGNORADO') THEN NOW() ELSE NULL END,
        resolvido_por_id = p_resolvido_por_id,
        resolvido_por_nome = p_resolvido_por_nome,
        observacao_resolucao = p_observacao,
        updated_at = NOW()
    WHERE id = p_alerta_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'message', 'Alerta atualizado para ' || p_status,
        'alerta_id', p_alerta_id
    );
END;
$function$
