CREATE OR REPLACE FUNCTION public.is_valid_cpf(cpf text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  clean text;
  sum1 int := 0;
  sum2 int := 0;
  i int;
  d1 int;
  d2 int;
BEGIN
  IF cpf IS NULL THEN RETURN NULL; END IF;
  clean := regexp_replace(cpf, '\D', '', 'g');
  IF length(clean) != 11 THEN RETURN false; END IF;
  IF clean ~ '^(\d)\1{10}$' THEN RETURN false; END IF;
  
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substring(clean, i, 1)::int * (11 - i));
  END LOOP;
  d1 := CASE WHEN (sum1 % 11) < 2 THEN 0 ELSE 11 - (sum1 % 11) END;
  IF d1 != substring(clean, 10, 1)::int THEN RETURN false; END IF;
  
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substring(clean, i, 1)::int * (12 - i));
  END LOOP;
  d2 := CASE WHEN (sum2 % 11) < 2 THEN 0 ELSE 11 - (sum2 % 11) END;
  RETURN d2 = substring(clean, 11, 1)::int;
END;
$function$
