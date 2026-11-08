CREATE OR REPLACE FUNCTION public.normalize_contact_phone()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.numero_normalizado := normalize_phone(NEW.numero);
    RETURN NEW;
END;
$function$
