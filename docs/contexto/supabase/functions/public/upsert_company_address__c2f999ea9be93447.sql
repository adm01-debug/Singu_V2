CREATE OR REPLACE FUNCTION public.upsert_company_address(p_company_id uuid, p_tipo character varying DEFAULT 'comercial'::character varying, p_cep character varying DEFAULT NULL::character varying, p_logradouro character varying DEFAULT NULL::character varying, p_numero character varying DEFAULT NULL::character varying, p_complemento character varying DEFAULT NULL::character varying, p_bairro character varying DEFAULT NULL::character varying, p_cidade character varying DEFAULT NULL::character varying, p_estado character varying DEFAULT NULL::character varying, p_pais character varying DEFAULT 'Brasil'::character varying, p_is_primary boolean DEFAULT false, p_address_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_id UUID;
BEGIN
    IF p_address_id IS NOT NULL THEN
        UPDATE company_addresses SET
            tipo = p_tipo,
            cep = p_cep,
            logradouro = p_logradouro,
            numero = p_numero,
            complemento = p_complemento,
            bairro = p_bairro,
            cidade = p_cidade,
            estado = p_estado,
            pais = p_pais,
            is_primary = p_is_primary,
            updated_at = NOW()
        WHERE id = p_address_id AND company_id = p_company_id
        RETURNING id INTO v_id;
    END IF;

    IF v_id IS NULL THEN
        INSERT INTO company_addresses (company_id, tipo, cep, logradouro, numero, complemento, bairro, cidade, estado, pais, is_primary)
        VALUES (p_company_id, p_tipo, p_cep, p_logradouro, p_numero, p_complemento, p_bairro, p_cidade, p_estado, p_pais, p_is_primary)
        RETURNING id INTO v_id;
    END IF;

    IF p_is_primary = true THEN
        UPDATE company_addresses SET is_primary = false
        WHERE company_id = p_company_id AND id != v_id AND is_primary = true;
    END IF;

    RETURN v_id;
END;
$function$
