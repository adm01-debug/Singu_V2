CREATE OR REPLACE FUNCTION public.format_cnpj(input text)
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
  IF length(clean) = 14 THEN
    RETURN substring(clean,1,2) || '.' || substring(clean,3,3) || '.' || 
           substring(clean,6,3) || '/' || substring(clean,9,4) || '-' || substring(clean,13,2);
  END IF;
  RETURN input;
END;
$function$
