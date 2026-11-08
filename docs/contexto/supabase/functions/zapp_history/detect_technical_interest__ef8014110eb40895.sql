CREATE OR REPLACE FUNCTION zapp_history.detect_technical_interest(p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_text_lower TEXT;
  v_signals TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('has_technical_interest',false); END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(ficha t[ée]cnica|data ?sheet|especifica[çc][ãao])' THEN v_signals := array_append(v_signals,'ficha_tecnica'); END IF;
  IF v_text_lower ~ '(laudo|certifica[çc][ãa]o|abnt|inmetro|iso \d+|rohs|ce mark)' THEN v_signals := array_append(v_signals,'certificacao'); END IF;
  IF v_text_lower ~ '(gramatura|composi[çc][ãa]o|material|textura|densidade)' THEN v_signals := array_append(v_signals,'material'); END IF;
  IF v_text_lower ~ '(amostra|sample|prova|prot[óo]tipo|mockup|mock-up|mock up)' THEN v_signals := array_append(v_signals,'amostra'); END IF;
  IF v_text_lower ~ '(dimens[õo]es|medidas|tamanho|espessura|\d+\s*(cm|mm|m)\M)' THEN v_signals := array_append(v_signals,'dimensoes'); END IF;

  RETURN jsonb_build_object(
    'has_technical_interest', array_length(v_signals,1) > 0,
    'signals', to_jsonb(v_signals),
    'count', COALESCE(array_length(v_signals,1),0)
  );
END;
$function$
