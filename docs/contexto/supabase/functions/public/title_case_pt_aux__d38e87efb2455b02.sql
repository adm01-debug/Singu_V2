CREATE OR REPLACE FUNCTION public.title_case_pt_aux(input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  parts TEXT[];
  i INT;
  result TEXT := '';
BEGIN
  IF input IS NULL OR trim(input) = '' THEN
    RETURN input;
  END IF;
  parts := string_to_array(input, '-');
  FOR i IN 1..array_length(parts, 1) LOOP
    IF i > 1 THEN result := result || '-'; END IF;
    result := result || upper(substring(parts[i], 1, 1)) || lower(substring(parts[i], 2));
  END LOOP;
  RETURN result;
END;
$function$
