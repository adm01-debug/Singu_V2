CREATE OR REPLACE FUNCTION public.normalize_address(p_logradouro text, p_tipo text DEFAULT NULL::text)
 RETURNS TABLE(tipo_normalizado text, logradouro_limpo text)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_logr  TEXT := TRIM(p_logradouro);
    v_tipo  TEXT := TRIM(p_tipo);
    v_upper TEXT;

    prefixes TEXT[][] := ARRAY[
        ARRAY['AVENIDA ',    'Avenida'],
        ARRAY['AV. ',        'Avenida'],
        ARRAY['AV ',         'Avenida'],
        ARRAY['RUA ',        'Rua'],
        ARRAY['R. ',         'Rua'],
        ARRAY['RODOVIA ',    'Rodovia'],
        ARRAY['ROD. ',       'Rodovia'],
        ARRAY['ROD ',        'Rodovia'],
        ARRAY['ESTRADA ',    'Estrada'],
        ARRAY['EST. ',       'Estrada'],
        ARRAY['TRAVESSA ',   'Travessa'],
        ARRAY['TRAV. ',      'Travessa'],
        ARRAY['TRAV ',       'Travessa'],
        ARRAY['ALAMEDA ',    'Alameda'],
        ARRAY['AL. ',        'Alameda'],
        ARRAY['PRACA ',      'Praça'],
        ARRAY['PRAÇA ',      'Praça'],
        ARRAY['QUADRA ',     'Quadra'],
        ARRAY['QD ',         'Quadra'],
        ARRAY['SETOR ',      'Setor'],
        ARRAY['VIA ',        'Via'],
        ARRAY['LINHA ',      'Linha'],
        ARRAY['VIELA ',      'Viela'],
        ARRAY['LARGO ',      'Largo'],
        ARRAY['BOULEVARD ',  'Boulevard'],
        ARRAY['PASSAGEM ',   'Passagem'],
        ARRAY['MARGINAL ',   'Marginal'],
        ARRAY['SERVIDAO ',   'Servidão'],
        ARRAY['PARQUE ',     'Parque'],
        ARRAY['FAZENDA ',    'Fazenda'],
        ARRAY['SITIO ',      'Sítio'],
        ARRAY['CONDOMINIO ', 'Condomínio'],
        ARRAY['COND. ',      'Condomínio'],
        ARRAY['DISTRITO ',   'Distrito'],
        ARRAY['LOTEAMENTO ', 'Loteamento']
    ];

    tipo_map TEXT[][] := ARRAY[
        ARRAY['AV',          'Avenida'],
        ARRAY['AV.',         'Avenida'],
        ARRAY['AVENIDA',     'Avenida'],
        ARRAY['RUA',         'Rua'],
        ARRAY['R.',          'Rua'],
        ARRAY['ROD',         'Rodovia'],
        ARRAY['ROD.',        'Rodovia'],
        ARRAY['RODOVIA',     'Rodovia'],
        ARRAY['EST',         'Estrada'],
        ARRAY['EST.',        'Estrada'],
        ARRAY['ESTRADA',     'Estrada'],
        ARRAY['TRAV',        'Travessa'],
        ARRAY['TRAVESSA',    'Travessa'],
        ARRAY['AL',          'Alameda'],
        ARRAY['ALAMEDA',     'Alameda'],
        ARRAY['PRACA',       'Praça'],
        ARRAY['PRAÇA',       'Praça'],
        ARRAY['QD',          'Quadra'],
        ARRAY['QUADRA',      'Quadra'],
        ARRAY['BL',          'Boulevard'],
        ARRAY['BOULEVARD',   'Boulevard'],
        ARRAY['PQ',          'Parque'],
        ARRAY['PARQUE',      'Parque'],
        ARRAY['FAZ',         'Fazenda'],
        ARRAY['FAZENDA',     'Fazenda']
    ];

    pair          TEXT[];
    detected_tipo TEXT := NULL;
    detected_logr TEXT := v_logr;
BEGIN
    IF v_logr IS NULL OR v_logr = '' THEN
        RETURN QUERY SELECT v_tipo, v_logr;
        RETURN;
    END IF;

    v_upper := UPPER(UNACCENT(v_logr));

    FOREACH pair SLICE 1 IN ARRAY prefixes LOOP
        IF v_upper LIKE (UPPER(UNACCENT(pair[1])) || '%') THEN
            detected_tipo := pair[2];
            detected_logr := TRIM(SUBSTR(v_logr, LENGTH(pair[1]) + 1));
            EXIT;
        END IF;
    END LOOP;

    IF v_tipo IS NOT NULL AND v_tipo != '' THEN
        FOREACH pair SLICE 1 IN ARRAY tipo_map LOOP
            IF UPPER(UNACCENT(v_tipo)) = UPPER(UNACCENT(pair[1])) THEN
                v_tipo := pair[2];
                EXIT;
            END IF;
        END LOOP;
    END IF;

    IF detected_tipo IS NOT NULL THEN
        RETURN QUERY SELECT detected_tipo, detected_logr;
    ELSE
        RETURN QUERY SELECT COALESCE(NULLIF(v_tipo, ''), NULL), v_logr;
    END IF;
END;
$function$
