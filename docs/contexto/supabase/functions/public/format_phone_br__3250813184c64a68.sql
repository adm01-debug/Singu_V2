CREATE OR REPLACE FUNCTION public.format_phone_br(p_phone text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_digits text;
BEGIN
  v_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  IF LENGTH(v_digits) = 11 THEN
    RETURN '(' || SUBSTRING(v_digits, 1, 2) || ') ' || SUBSTRING(v_digits, 3, 5) || '-' || SUBSTRING(v_digits, 8, 4);
  ELSIF LENGTH(v_digits) = 10 THEN
    RETURN '(' || SUBSTRING(v_digits, 1, 2) || ') ' || SUBSTRING(v_digits, 3, 4) || '-' || SUBSTRING(v_digits, 7, 4);
  ELSE
    RETURN p_phone;
  END IF;
END;
$function$
