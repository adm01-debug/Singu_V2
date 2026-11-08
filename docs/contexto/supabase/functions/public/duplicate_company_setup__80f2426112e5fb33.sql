CREATE OR REPLACE FUNCTION public.duplicate_company_setup(p_source_id uuid, p_new_trade_name text, p_new_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO companies (
    nome_fantasia, nome_crm, razao_social, ramo_atividade, status, 
    observacoes, user_id, source, state, city
  )
  SELECT 
    p_new_trade_name, p_new_trade_name, razao_social, ramo_atividade, 'ativo',
    'Copiado de: ' || COALESCE(nome_fantasia, nome_crm, razao_social), p_new_user_id, 'manual', state, city
  FROM companies
  WHERE id = p_source_id
  RETURNING id INTO v_new_id;
  
  INSERT INTO addresses (company_id, type, street, number, complement, neighborhood, city, state, zip_code)
  SELECT v_new_id, type, street, number, complement, neighborhood, city, state, zip_code
  FROM addresses
  WHERE company_id = p_source_id;
  
  RETURN v_new_id;
END;
$function$
