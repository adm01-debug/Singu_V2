CREATE OR REPLACE FUNCTION public.validate_import_data(p_data jsonb, p_entity_type text DEFAULT 'company'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  errors jsonb := '[]'::jsonb;
  item jsonb;
  idx int := 0;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    idx := idx + 1;
    
    IF p_entity_type = 'company' THEN
      -- Validar campos obrigatórios de empresa
      IF item->>'nome_crm' IS NULL OR item->>'nome_crm' = '' THEN
        errors := errors || jsonb_build_object('linha', idx, 'erro', 'nome_crm obrigatório');
      END IF;
      
      -- Validar CNPJ se presente
      IF item->>'cnpj' IS NOT NULL AND LENGTH(REGEXP_REPLACE(item->>'cnpj', '[^0-9]', '', 'g')) NOT IN (11, 14) THEN
        errors := errors || jsonb_build_object('linha', idx, 'erro', 'CNPJ/CPF inválido');
      END IF;
      
    ELSIF p_entity_type = 'contact' THEN
      -- Validar campos obrigatórios de contato
      IF item->>'full_name' IS NULL OR item->>'full_name' = '' THEN
        errors := errors || jsonb_build_object('linha', idx, 'erro', 'full_name obrigatório');
      END IF;
      IF item->>'company_id' IS NULL THEN
        errors := errors || jsonb_build_object('linha', idx, 'erro', 'company_id obrigatório');
      END IF;
    END IF;
  END LOOP;
  
  SELECT jsonb_build_object(
    'valido', jsonb_array_length(errors) = 0,
    'total_registros', jsonb_array_length(p_data),
    'total_erros', jsonb_array_length(errors),
    'erros', errors
  ) INTO result;
  
  RETURN result;
END;
$function$
