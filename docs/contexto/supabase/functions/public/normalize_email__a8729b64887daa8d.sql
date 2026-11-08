CREATE OR REPLACE FUNCTION public.normalize_email(email_input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF email_input IS NULL OR email_input = '' THEN RETURN NULL; END IF;
  RETURN LOWER(TRIM(email_input));
END;
$function$
