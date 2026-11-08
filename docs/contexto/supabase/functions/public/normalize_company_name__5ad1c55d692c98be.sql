CREATE OR REPLACE FUNCTION public.normalize_company_name(p_name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN TRIM(UPPER(
    regexp_replace(
      regexp_replace(p_name, '\s+(LTDA|ME|EPP|EIRELI|S\.?A\.?|S/A)\.?$', '', 'i'),
      '\s+', ' ', 'g'
    )
  ));
END;
$function$
