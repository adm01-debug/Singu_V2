CREATE OR REPLACE FUNCTION public.normalize_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.email_normalizado := LOWER(TRIM(NEW.email));
    RETURN NEW;
END;
$function$
