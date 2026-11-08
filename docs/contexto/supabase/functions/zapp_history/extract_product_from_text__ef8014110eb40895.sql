CREATE OR REPLACE FUNCTION zapp_history.extract_product_from_text(p_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  r RECORD;
  v_text_lower TEXT;
  v_pattern TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  FOR r IN SELECT canonical_name, patterns FROM zapp_history.product_dictionary
  LOOP
    FOREACH v_pattern IN ARRAY r.patterns
    LOOP
      IF v_text_lower ~ ('\m' || lower(v_pattern) || '\M') THEN
        RETURN r.canonical_name;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NULL;
END;
$function$
