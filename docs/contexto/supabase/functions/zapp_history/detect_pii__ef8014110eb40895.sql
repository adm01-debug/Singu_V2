CREATE OR REPLACE FUNCTION zapp_history.detect_pii(p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_fields TEXT[] := ARRAY[]::TEXT[];
  v_redacted TEXT := COALESCE(p_text, '');
BEGIN
  IF p_text IS NULL OR p_text = '' THEN
    RETURN jsonb_build_object('contains_pii', false, 'fields', '[]'::jsonb, 'redacted', '');
  END IF;

  IF p_text ~ '\d{3}\.?\d{3}\.?\d{3}-?\d{2}' THEN
    v_fields := array_append(v_fields, 'cpf');
    v_redacted := regexp_replace(v_redacted, '\d{3}\.?\d{3}\.?\d{3}-?\d{2}', '[CPF]', 'g');
  END IF;

  IF p_text ~ '\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}' THEN
    v_fields := array_append(v_fields, 'cnpj');
    v_redacted := regexp_replace(v_redacted, '\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}', '[CNPJ]', 'g');
  END IF;

  IF p_text ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' THEN
    v_fields := array_append(v_fields, 'email');
    v_redacted := regexp_replace(v_redacted, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[EMAIL]', 'g');
  END IF;

  IF p_text ~ '\(?\d{2}\)?\s?9?\d{4}-?\d{4}' THEN
    v_fields := array_append(v_fields, 'phone');
    v_redacted := regexp_replace(v_redacted, '\(?\d{2}\)?\s?9?\d{4}-?\d{4}', '[PHONE]', 'g');
  END IF;

  IF p_text ~ '\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}' THEN
    v_fields := array_append(v_fields, 'credit_card');
    v_redacted := regexp_replace(v_redacted, '\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}', '[CARD]', 'g');
  END IF;

  RETURN jsonb_build_object(
    'contains_pii', cardinality(v_fields) > 0,
    'fields', to_jsonb(v_fields),
    'redacted', v_redacted
  );
END;
$function$
