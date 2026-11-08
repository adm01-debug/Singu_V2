CREATE OR REPLACE FUNCTION public.upsert_company_address(p_company_id uuid, p_tipo character varying DEFAULT 'comercial'::character varying, p_cep character varying DEFAULT NULL::character varying, p_logradouro character varying DEFAULT NULL::character varying, p_numero character varying DEFAULT NULL::character varying, p_complemento character varying DEFAULT NULL::character varying, p_bairro character varying DEFAULT NULL::character varying, p_cidade character varying DEFAULT NULL::character varying, p_estado character varying DEFAULT NULL::character varying, p_pais character varying DEFAULT 'Brasil'::character varying, p_is_primary boolean DEFAULT false, p_latitude numeric DEFAULT NULL::numeric, p_longitude numeric DEFAULT NULL::numeric, p_ponto_referencia character varying DEFAULT NULL::character varying, p_instrucoes_entrega text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_address_id UUID;
BEGIN
    -- Se is_primary = true, desmarcar outros primários dessa empresa
    IF p_is_primary THEN
        UPDATE company_addresses 
        SET is_primary = false 
        WHERE company_id = p_company_id AND is_primary = true;
    END IF;

    -- Tentar atualizar endereço existente do mesmo tipo
    UPDATE company_addresses
    SET 
        cep = COALESCE(p_cep, cep),
        logradouro = COALESCE(p_logradouro, logradouro),
        numero = COALESCE(p_numero, numero),
        complemento = COALESCE(p_complemento, complemento),
        bairro = COALESCE(p_bairro, bairro),
        cidade = COALESCE(p_cidade, cidade),
        estado = COALESCE(p_estado, estado),
        pais = COALESCE(p_pais, pais),
        is_primary = p_is_primary,
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude),
        ponto_referencia = COALESCE(p_ponto_referencia, ponto_referencia),
        instrucoes_entrega = COALESCE(p_instrucoes_entrega, instrucoes_entrega),
        updated_at = NOW()
    WHERE company_id = p_company_id AND tipo = p_tipo
    RETURNING id INTO v_address_id;

    -- Se não existia, inserir novo
    IF v_address_id IS NULL THEN
        INSERT INTO company_addresses (
            company_id, tipo, is_primary, cep, logradouro, numero,
            complemento, bairro, cidade, estado, pais,
            latitude, longitude, ponto_referencia, instrucoes_entrega
        ) VALUES (
            p_company_id, p_tipo, p_is_primary, p_cep, p_logradouro, p_numero,
            p_complemento, p_bairro, p_cidade, p_estado, p_pais,
            p_latitude, p_longitude, p_ponto_referencia, p_instrucoes_entrega
        )
        RETURNING id INTO v_address_id;
    END IF;

    RETURN v_address_id;
END;
$function$
