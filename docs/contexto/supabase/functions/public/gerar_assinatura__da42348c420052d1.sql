CREATE OR REPLACE FUNCTION public.gerar_assinatura(p_first_name text, p_last_name text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE nome TEXT;
BEGIN
  IF p_first_name IS NULL OR p_first_name = '' OR p_first_name LIKE '%@%'
    OR LOWER(p_first_name) IN ('sem nome', 'guest') THEN RETURN NULL;
  END IF;
  nome := INITCAP(TRIM(p_first_name));
  IF p_last_name IS NOT NULL AND p_last_name != '' THEN
    nome := nome || ' ' || INITCAP(TRIM(p_last_name));
  END IF;
  RETURN nome;
END;
$function$
