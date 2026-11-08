CREATE OR REPLACE FUNCTION public.validate_import_row(p_row jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_errors text[] := ARRAY[]::text[];
  v_warnings text[] := ARRAY[]::text[];
BEGIN
  -- Validações obrigatórias
  IF p_row->>'trade_name' IS NULL OR TRIM(p_row->>'trade_name') = '' THEN
    v_errors := array_append(v_errors, 'Nome fantasia é obrigatório');
  END IF;
  
  -- Validações de formato
  IF p_row->>'cnpj' IS NOT NULL THEN
    IF length(regexp_replace(p_row->>'cnpj', '[^0-9]', '', 'g')) NOT IN (8, 11, 14) THEN
      v_errors := array_append(v_errors, 'CNPJ/CPF com formato inválido');
    END IF;
  END IF;
  
  IF p_row->>'email' IS NOT NULL THEN
    IF p_row->>'email' !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      v_warnings := array_append(v_warnings, 'Email com formato possivelmente inválido');
    END IF;
  END IF;
  
  -- Validação de duplicata
  IF p_row->>'cnpj' IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM companies WHERE cnpj = regexp_replace(p_row->>'cnpj', '[^0-9]', '', 'g')) THEN
      v_warnings := array_append(v_warnings, 'CNPJ já existe no sistema');
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', array_length(v_errors, 1) IS NULL,
    'errors', v_errors,
    'warnings', v_warnings
  );
END;
$function$
