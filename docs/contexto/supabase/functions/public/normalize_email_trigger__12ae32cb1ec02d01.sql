CREATE OR REPLACE FUNCTION public.normalize_email_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Normaliza o campo 'email' se não for NULL
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    NEW.email = LOWER(TRIM(NEW.email));
  END IF;
  
  RETURN NEW;
END;
$function$
