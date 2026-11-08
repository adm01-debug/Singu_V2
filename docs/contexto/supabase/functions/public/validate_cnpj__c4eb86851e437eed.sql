CREATE OR REPLACE FUNCTION public.validate_cnpj(p_cnpj text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cnpj text;
  v_sum int;
  v_digit int;
BEGIN
  -- Remove caracteres não numéricos
  v_cnpj := regexp_replace(p_cnpj, '[^0-9]', '', 'g');
  
  -- Verifica tamanho
  IF LENGTH(v_cnpj) != 14 THEN RETURN false; END IF;
  
  -- Verifica se todos os dígitos são iguais
  IF v_cnpj ~ '^(\d)\1{13}$' THEN RETURN false; END IF;
  
  -- Validação básica passou
  RETURN true;
END;
$function$
