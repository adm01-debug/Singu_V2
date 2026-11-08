CREATE OR REPLACE FUNCTION public.validate_company_data(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_issues TEXT[] := '{}';
  v_company RECORD;
BEGIN
  SELECT * INTO v_company FROM companies WHERE id = p_company_id;
  
  IF v_company.nome_fantasia IS NULL OR LENGTH(v_company.nome_fantasia) < 2 THEN
    v_issues := array_append(v_issues, 'Nome fantasia ausente ou muito curto');
  END IF;
  
  IF v_company.cnpj IS NULL THEN
    v_issues := array_append(v_issues, 'CNPJ ausente');
  ELSIF LENGTH(REGEXP_REPLACE(v_company.cnpj, '[^0-9]', '', 'g')) NOT IN (8, 14) THEN
    v_issues := array_append(v_issues, 'CNPJ com formato inválido');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL) THEN
    v_issues := array_append(v_issues, 'Sem contatos cadastrados');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM company_addresses WHERE company_id = p_company_id) THEN
    v_issues := array_append(v_issues, 'Sem endereço cadastrado');
  END IF;
  
  IF v_company.ramo_atividade IS NULL THEN
    v_issues := array_append(v_issues, 'Ramo de atividade não informado');
  END IF;
  
  IF v_company.user_id IS NULL THEN
    v_issues := array_append(v_issues, 'Sem vendedor atribuído');
  END IF;
  
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'company_name', v_company.nome_fantasia,
    'is_valid', array_length(v_issues, 1) IS NULL,
    'issues', v_issues,
    'completeness_pct', ROUND(100.0 * (6 - COALESCE(array_length(v_issues, 1), 0)) / 6, 1)
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
