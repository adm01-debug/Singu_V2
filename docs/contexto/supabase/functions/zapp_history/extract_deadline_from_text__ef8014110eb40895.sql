CREATE OR REPLACE FUNCTION zapp_history.extract_deadline_from_text(p_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_text_lower TEXT;
  v_match TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Urgência absoluta
  IF v_text_lower ~ '\m(urgent[ei]|asap|para ontem|imediat[ao]|imediatamente|pra ontem)\M' THEN
    RETURN 'URGENTE';
  END IF;

  -- "em X dias/semanas/meses"
  v_match := (regexp_match(v_text_lower, '(?:em|prazo de|prazo|para entrega em|entrega em|até)\s*(\d+\s*(?:dias?|semanas?|meses?))'))[1];
  IF v_match IS NOT NULL THEN RETURN v_match; END IF;

  -- "até sexta", "até dia X"
  v_match := (regexp_match(v_text_lower, 'at[eé]\s*(segunda|terça|quarta|quinta|sexta|sábado|sabado|domingo|dia\s*\d+|próxim[oa]\s*\w+)'))[1];
  IF v_match IS NOT NULL THEN RETURN 'até ' || v_match; END IF;

  RETURN NULL;
END;
$function$
