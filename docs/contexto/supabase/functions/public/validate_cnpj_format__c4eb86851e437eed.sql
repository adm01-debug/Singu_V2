CREATE OR REPLACE FUNCTION public.validate_cnpj_format(p_cnpj text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  clean text;
  len int;
BEGIN
  clean := REGEXP_REPLACE(p_cnpj, '[^0-9]', '', 'g');
  len := LENGTH(clean);
  
  RETURN jsonb_build_object(
    'original', p_cnpj,
    'limpo', clean,
    'tamanho', len,
    'valido', len IN (8, 14),
    'tipo', CASE 
      WHEN len = 8 THEN 'base_cnpj'
      WHEN len = 14 THEN 'cnpj_completo'
      ELSE 'invalido'
    END
  );
END;
$function$
