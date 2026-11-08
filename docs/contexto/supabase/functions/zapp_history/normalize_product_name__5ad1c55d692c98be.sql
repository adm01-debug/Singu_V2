CREATE OR REPLACE FUNCTION zapp_history.normalize_product_name(p_name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_lower TEXT;
  v_match TEXT;
BEGIN
  IF p_name IS NULL THEN RETURN NULL; END IF;
  v_lower := lower(trim(p_name));

  -- Match exato no canonical
  SELECT canonical_name INTO v_match FROM zapp_history.product_dictionary WHERE canonical_name = v_lower LIMIT 1;
  IF v_match IS NOT NULL THEN RETURN v_match; END IF;

  -- Match em qualquer pattern
  SELECT canonical_name INTO v_match
  FROM zapp_history.product_dictionary
  WHERE v_lower = ANY(patterns) OR v_lower = ANY(SELECT lower(unnest(patterns)))
  LIMIT 1;
  IF v_match IS NOT NULL THEN RETURN v_match; END IF;

  -- Match removendo plural simples (s/es no final)
  IF v_lower ~ 's$' THEN
    SELECT canonical_name INTO v_match
    FROM zapp_history.product_dictionary
    WHERE canonical_name = regexp_replace(v_lower, 's$', '')
       OR regexp_replace(v_lower, 's$', '') = ANY(patterns)
    LIMIT 1;
    IF v_match IS NOT NULL THEN RETURN v_match; END IF;
  END IF;

  -- LIKE fuzzy: dicionário contém o nome
  SELECT canonical_name INTO v_match
  FROM zapp_history.product_dictionary
  WHERE EXISTS (
    SELECT 1 FROM unnest(patterns) p WHERE v_lower LIKE '%' || lower(p) || '%' OR lower(p) LIKE '%' || v_lower || '%'
  )
  ORDER BY length(canonical_name) ASC
  LIMIT 1;

  RETURN COALESCE(v_match, v_lower);
END;
$function$
