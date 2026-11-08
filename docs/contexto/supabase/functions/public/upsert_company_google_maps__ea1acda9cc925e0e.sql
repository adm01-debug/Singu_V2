CREATE OR REPLACE FUNCTION public.upsert_company_google_maps(p_company_id uuid, p_google_maps_url text, p_handle text DEFAULT NULL::text, p_latitude double precision DEFAULT NULL::double precision, p_longitude double precision DEFAULT NULL::double precision, p_google_place_id text DEFAULT NULL::text, p_origem text DEFAULT 'manual'::text)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_place_id TEXT;
    v_address_id UUID;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
    -- Determinar place_id: parâmetro explícito > handle > extrair da URL
    v_place_id := COALESCE(
        p_google_place_id, 
        CASE WHEN p_handle LIKE 'ChIJ%' THEN p_handle ELSE NULL END,
        CASE WHEN p_google_maps_url LIKE '%place_id:%' 
             THEN split_part(p_google_maps_url, 'place_id:', 2)
             ELSE NULL END
    );

    -- Atualizar endereço primário existente
    UPDATE company_addresses 
    SET google_place_id = COALESCE(v_place_id, google_place_id),
        google_maps_url = COALESCE(p_google_maps_url, google_maps_url),
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude),
        updated_at = NOW()
    WHERE company_id = p_company_id 
      AND is_primary = true
    RETURNING id INTO v_address_id;
    
    -- Se não existe endereço primário, criar um
    IF v_address_id IS NULL THEN
        INSERT INTO company_addresses (
            company_id, tipo, is_primary, 
            latitude, longitude, google_place_id, google_maps_url, 
            pais, origem
        ) VALUES (
            p_company_id, 'comercial', true,
            p_latitude, p_longitude, v_place_id, p_google_maps_url,
            'Brasil', p_origem
        )
        RETURNING id INTO v_address_id;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'company_id', p_company_id,
        'address_id', v_address_id,
        'google_place_id', v_place_id,
        'google_maps_url', p_google_maps_url,
        'source', 'company_addresses'
    );
END;
$function$
