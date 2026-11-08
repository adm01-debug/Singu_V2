CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM contact_emails WHERE LOWER(email) = LOWER(p_email)
    UNION ALL
    SELECT 1 FROM company_emails WHERE LOWER(email) = LOWER(p_email)
  );
END;
$function$
