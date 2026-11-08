CREATE OR REPLACE FUNCTION public.format_cpf(input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  clean text;
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  clean := regexp_replace(input, '\D', '', 'g');
  IF length(clean) = 11 THEN
    RETURN substring(clean,1,3) || '.' || substring(clean,4,3) || '.' || 
           substring(clean,7,3) || '-' || substring(clean,10,2);
  END IF;
  RETURN input;
END;
$function$
