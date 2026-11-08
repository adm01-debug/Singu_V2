CREATE OR REPLACE FUNCTION public.get_company_phone(p_company_id uuid, p_tipo text DEFAULT 'primary'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_result RECORD;
BEGIN
    CASE p_tipo
        WHEN 'primary' THEN
            SELECT cp.numero, cp.numero_normalizado, cp.is_whatsapp, cp.phone_type::TEXT
            INTO v_result FROM company_phones cp
            WHERE cp.company_id = p_company_id AND cp.is_primary = TRUE
            ORDER BY cp.updated_at DESC LIMIT 1;
        WHEN 'whatsapp' THEN
            SELECT cp.numero, cp.numero_normalizado, cp.is_whatsapp, cp.phone_type::TEXT
            INTO v_result FROM company_phones cp
            WHERE cp.company_id = p_company_id AND cp.is_whatsapp = TRUE
            ORDER BY cp.is_primary DESC LIMIT 1;
        ELSE
            SELECT cp.numero, cp.numero_normalizado, cp.is_whatsapp, cp.phone_type::TEXT
            INTO v_result FROM company_phones cp
            WHERE cp.company_id = p_company_id
            ORDER BY cp.is_primary DESC, cp.updated_at DESC LIMIT 1;
    END CASE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'not_found');
    END IF;

    RETURN jsonb_build_object(
        'status', 'success',
        'numero', v_result.numero,
        'numero_normalizado', v_result.numero_normalizado,
        'is_whatsapp', v_result.is_whatsapp,
        'tipo', v_result.phone_type
    );
END;
$function$
