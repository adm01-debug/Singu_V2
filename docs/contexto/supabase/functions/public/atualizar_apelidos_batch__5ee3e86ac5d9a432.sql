CREATE OR REPLACE FUNCTION public.atualizar_apelidos_batch(p_dados jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_item JSONB;
    v_total INT := 0;
    v_atualizados INT := 0;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_dados)
    LOOP
        v_total := v_total + 1;

        UPDATE contacts ct
        SET apelido = TRIM(v_item->>'apelido'),
            updated_at = NOW()
        WHERE ct.id = (v_item->>'id')::UUID
          AND ct.deleted_at IS NULL
          AND TRIM(COALESCE(v_item->>'apelido', '')) != '';

        IF FOUND THEN
            v_atualizados := v_atualizados + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success',
        'total_recebidos', v_total,
        'atualizados', v_atualizados,
        'message', v_atualizados || ' apelidos atualizados de ' || v_total || ' recebidos.'
    );
END;
$function$
