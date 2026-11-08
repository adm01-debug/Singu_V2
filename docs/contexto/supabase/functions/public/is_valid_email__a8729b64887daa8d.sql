CREATE OR REPLACE FUNCTION public.is_valid_email(email_input text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF email_input IS NULL OR email_input = '' THEN RETURN false; END IF;
  RETURN email_input ~* '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$';
END;
$function$
