CREATE OR REPLACE FUNCTION public.format_phone(input text)
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
    RETURN '(' || substring(clean,1,2) || ') ' || substring(clean,3,5) || '-' || substring(clean,8,4);
  ELSIF length(clean) = 10 THEN
    RETURN '(' || substring(clean,1,2) || ') ' || substring(clean,3,4) || '-' || substring(clean,7,4);
  END IF;
  RETURN input;
END;
$function$
