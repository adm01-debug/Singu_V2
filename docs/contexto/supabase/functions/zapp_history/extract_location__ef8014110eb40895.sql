CREATE OR REPLACE FUNCTION zapp_history.extract_location(p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  r RECORD;
  v_text_lower TEXT;
  v_pattern TEXT;
  v_cep TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Procura cidades/UFs no dicionário
  FOR r IN SELECT city, state, region, is_capital, patterns FROM zapp_history.location_dictionary
  LOOP
    FOREACH v_pattern IN ARRAY r.patterns
    LOOP
      IF v_text_lower ~ ('\m' || lower(v_pattern) || '\M') THEN
        v_cep := (regexp_match(p_text, '\d{5}-?\d{3}'))[1];
        RETURN jsonb_build_object(
          'city', r.city,
          'state', r.state,
          'region', r.region,
          'is_capital', r.is_capital,
          'cep', v_cep
        );
      END IF;
    END LOOP;
  END LOOP;

  -- Só CEP sem cidade
  v_cep := (regexp_match(p_text, '\d{5}-?\d{3}'))[1];
  IF v_cep IS NOT NULL THEN
    RETURN jsonb_build_object('cep', v_cep);
  END IF;

  RETURN NULL;
END;
$function$
