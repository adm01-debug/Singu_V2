-- Função atômica para mover um Deal
CREATE OR REPLACE FUNCTION public.move_deal(
    p_deal_id UUID,
    p_new_stage_id UUID,
    p_new_probability NUMERIC DEFAULT NULL
) RETURNS public.deals AS $$
DECLARE
    v_deal public.deals;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Verificar existência e posse/acesso
    SELECT * INTO v_deal FROM public.deals WHERE id = p_deal_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal não encontrado';
    END IF;

    -- Validar se o usuário tem permissão (exemplo simples: é o dono ou admin)
    -- Em um sistema real, isso pode ser mais complexo
    IF v_deal.user_id != v_user_id AND NOT public.has_role(v_user_id, 'admin') THEN
        RAISE EXCEPTION 'Sem permissão para mover este negócio';
    END IF;

    -- O trigger tr_validate_deal_stage_transition que criamos anteriormente 
    -- cuidará da validação da regra de negócio (fluxo permitido) durante o UPDATE.

    UPDATE public.deals
    SET 
        stage_id = p_new_stage_id,
        probability = COALESCE(p_new_probability, probability),
        updated_at = now()
    WHERE id = p_deal_id
    RETURNING * INTO v_deal;

    RETURN v_deal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função atômica para atualizar valor do Deal
CREATE OR REPLACE FUNCTION public.update_deal_amount(
    p_deal_id UUID,
    p_new_value NUMERIC
) RETURNS public.deals AS $$
DECLARE
    v_deal public.deals;
BEGIN
    -- Validação básica
    IF p_new_value < 0 THEN
        RAISE EXCEPTION 'Valor do negócio não pode ser negativo';
    END IF;

    UPDATE public.deals
    SET 
        value = p_new_value,
        updated_at = now()
    WHERE id = p_deal_id
    AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    RETURNING * INTO v_deal;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal não encontrado ou sem permissão';
    END IF;

    RETURN v_deal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
