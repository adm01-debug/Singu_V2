CREATE OR REPLACE FUNCTION public.extrair_nome_tratamento(p_first_name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_first_name IS NULL OR p_first_name = '' OR p_first_name LIKE '%@%'
    OR LOWER(p_first_name) IN ('sem nome', 'guest') THEN RETURN NULL;
  END IF;
  RETURN INITCAP(SPLIT_PART(TRIM(p_first_name), ' ', 1));
END;
$function$
