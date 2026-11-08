CREATE OR REPLACE FUNCTION public.normalizar_cnpj(cnpj_input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  digits TEXT;
BEGIN
  IF cnpj_input IS NULL OR trim(cnpj_input) = '' THEN
    RETURN NULL;
  END IF;
  digits := regexp_replace(cnpj_input, '[^0-9]', '', 'g');
  IF length(digits) = 14 THEN
    RETURN substring(digits,1,2)||'.'||
           substring(digits,3,3)||'.'||
           substring(digits,6,3)||'/'||
           substring(digits,9,4)||'-'||
           substring(digits,13,2);
  END IF;
  RETURN NULL; -- CNPJs com tamanho != 14 ficam NULL para revisão
END;
$function$
