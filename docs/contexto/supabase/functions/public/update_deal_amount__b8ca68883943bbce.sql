CREATE OR REPLACE FUNCTION public.update_deal_amount(p_deal_id uuid, p_new_value numeric)
 RETURNS deals
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
