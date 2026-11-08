CREATE OR REPLACE FUNCTION public.normalize_phone_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Normaliza o campo 'numero' se não for NULL
  IF NEW.numero IS NOT NULL AND NEW.numero != '' THEN
    NEW.numero = regexp_replace(NEW.numero, '[^0-9]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$function$
