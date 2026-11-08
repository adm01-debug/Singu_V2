CREATE OR REPLACE FUNCTION public.importar_apelidos_bitrix(p_dados jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_item JSONB;
    v_total INT := 0;
    v_atualizados INT := 0;
    v_nao_encontrados INT := 0;
    v_ja_preenchidos INT := 0;
    v_erros TEXT[] := ARRAY[]::TEXT[];
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_dados)
    LOOP
        v_total := v_total + 1;

        UPDATE contacts ct
        SET apelido = TRIM(v_item->>'apelido'),
            updated_at = NOW()
        WHERE ct.bitrix_contact_id = (v_item->>'bitrix_id')::INTEGER
          AND ct.apelido IS NULL
          AND ct.deleted_at IS NULL
          AND TRIM(COALESCE(v_item->>'apelido', '')) != '';

        IF FOUND THEN
            v_atualizados := v_atualizados + 1;
        ELSE
            IF EXISTS (
                SELECT 1 FROM contacts ct2
                WHERE ct2.bitrix_contact_id = (v_item->>'bitrix_id')::INTEGER
                  AND ct2.apelido IS NOT NULL
                  AND ct2.deleted_at IS NULL
            ) THEN
                v_ja_preenchidos := v_ja_preenchidos + 1;
            ELSE
                v_nao_encontrados := v_nao_encontrados + 1;
                v_erros := array_append(v_erros, 'bitrix_id ' || (v_item->>'bitrix_id') || ' não encontrado');
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success',
        'total_recebidos', v_total,
        'atualizados', v_atualizados,
        'ja_preenchidos', v_ja_preenchidos,
        'nao_encontrados', v_nao_encontrados,
        'erros', to_jsonb(v_erros)
    );
END;
$function$
