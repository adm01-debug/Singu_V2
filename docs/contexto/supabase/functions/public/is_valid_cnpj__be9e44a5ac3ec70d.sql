CREATE OR REPLACE FUNCTION public.is_valid_cnpj(cnpj text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  clean text;
  sum1 int := 0;
  sum2 int := 0;
  weights1 int[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  weights2 int[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  i int;
  d1 int;
  d2 int;
BEGIN
  IF cnpj IS NULL THEN RETURN NULL; END IF;
  clean := regexp_replace(cnpj, '\D', '', 'g');
  IF length(clean) != 14 THEN RETURN false; END IF;
  IF clean ~ '^(\d)\1{13}$' THEN RETURN false; END IF;
  
  FOR i IN 1..12 LOOP
    sum1 := sum1 + (substring(clean, i, 1)::int * weights1[i]);
  END LOOP;
  d1 := CASE WHEN (sum1 % 11) < 2 THEN 0 ELSE 11 - (sum1 % 11) END;
  IF d1 != substring(clean, 13, 1)::int THEN RETURN false; END IF;
  
  FOR i IN 1..13 LOOP
    sum2 := sum2 + (substring(clean, i, 1)::int * weights2[i]);
  END LOOP;
  d2 := CASE WHEN (sum2 % 11) < 2 THEN 0 ELSE 11 - (sum2 % 11) END;
  RETURN d2 = substring(clean, 14, 1)::int;
END;
$function$
