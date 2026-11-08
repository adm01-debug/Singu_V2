CREATE OR REPLACE FUNCTION public.sanitize_cnpj(input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  RETURN regexp_replace(input, '\D', '', 'g');
END;
$function$
