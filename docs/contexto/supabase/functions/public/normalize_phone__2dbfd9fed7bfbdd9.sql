CREATE OR REPLACE FUNCTION public.normalize_phone(phone_number text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Remove tudo que não é número
  RETURN regexp_replace(phone_number, '[^0-9]', '', 'g');
END;
$function$
