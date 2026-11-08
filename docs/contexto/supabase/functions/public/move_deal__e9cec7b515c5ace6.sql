CREATE OR REPLACE FUNCTION public.move_deal(p_deal_id uuid, p_new_stage_id uuid, p_new_probability numeric DEFAULT NULL::numeric)
 RETURNS deals
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
