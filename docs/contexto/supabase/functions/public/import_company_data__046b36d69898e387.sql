CREATE OR REPLACE FUNCTION public.import_company_data(p_data jsonb, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO companies (
    id, nome_fantasia, razao_social, cnpj, 
    ramo_atividade, status, user_id, created_at
  ) VALUES (
    gen_random_uuid(),
    p_data->>'nome_fantasia',
    p_data->>'razao_social',
    p_data->>'cnpj',
    p_data->>'ramo_atividade',
    'ativo',
    p_user_id,
    NOW()
  )
  RETURNING id INTO v_company_id;
  
  IF p_data->'contacts' IS NOT NULL THEN
    INSERT INTO contacts (id, company_id, full_name, cargo, created_at)
    SELECT 
      gen_random_uuid(),
      v_company_id,
      c->>'full_name',
      c->>'cargo',
      NOW()
    FROM jsonb_array_elements(p_data->'contacts') as c;
  END IF;
  
  RETURN v_company_id;
END;
$function$
