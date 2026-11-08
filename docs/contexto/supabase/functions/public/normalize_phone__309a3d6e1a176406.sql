CREATE OR REPLACE FUNCTION public.normalize_phone(phone character varying)
 RETURNS character varying
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN regexp_replace(phone, '[^0-9]', '', 'g');
END;
$function$
