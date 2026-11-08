CREATE OR REPLACE FUNCTION public.classificar_telefone(phone_input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE cleaned TEXT;
BEGIN
  IF phone_input IS NULL OR phone_input = '' THEN RETURN 'desconhecido'; END IF;
  cleaned := regexp_replace(phone_input, '[^0-9]', '', 'g');
  IF LENGTH(cleaned) = 11 AND SUBSTRING(cleaned FROM 3 FOR 1) = '9' THEN RETURN 'celular';
  ELSIF LENGTH(cleaned) = 13 AND SUBSTRING(cleaned FROM 5 FOR 1) = '9' THEN RETURN 'celular';
  ELSIF LENGTH(cleaned) = 10 THEN RETURN 'fixo';
  ELSIF LENGTH(cleaned) = 12 AND LEFT(cleaned, 2) = '55' THEN RETURN 'fixo';
  ELSE RETURN 'outro';
  END IF;
END;
$function$
