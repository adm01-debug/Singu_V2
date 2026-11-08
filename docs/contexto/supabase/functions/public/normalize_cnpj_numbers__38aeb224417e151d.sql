CREATE OR REPLACE FUNCTION public.normalize_cnpj_numbers(p_dry_run boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  affected_count int := 0;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_dry_run THEN
    SELECT COUNT(*) INTO affected_count
    FROM companies 
    WHERE cnpj IS NOT NULL 
    AND cnpj ~ '[^0-9]'
    AND deleted_at IS NULL;
    
    SELECT jsonb_build_object(
      'dry_run', true,
      'registros_afetados', affected_count,
      'acao', 'Remover caracteres não numéricos de CNPJs'
    ) INTO result;
  ELSE
    UPDATE companies 
    SET cnpj = REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g')
    WHERE cnpj IS NOT NULL 
    AND cnpj ~ '[^0-9]'
    AND deleted_at IS NULL;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    SELECT jsonb_build_object(
      'dry_run', false,
      'registros_atualizados', affected_count,
      'acao', 'CNPJs normalizados com sucesso'
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$function$
