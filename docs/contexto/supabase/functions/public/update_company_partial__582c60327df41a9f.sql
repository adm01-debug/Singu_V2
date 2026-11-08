CREATE OR REPLACE FUNCTION public.update_company_partial(p_company_id uuid, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  UPDATE companies SET
    nome_crm      = COALESCE(p_data->>'nome_crm',      nome_crm),
    razao_social  = COALESCE(p_data->>'razao_social',  razao_social),
    nome_fantasia = COALESCE(p_data->>'nome_fantasia',  nome_fantasia),
    cnpj          = COALESCE(p_data->>'cnpj',           cnpj),
    email         = COALESCE(p_data->>'email',          email),
    telefone      = COALESCE(p_data->>'telefone',       telefone),
    endereco      = COALESCE(p_data->>'endereco',       endereco),
    cidade        = COALESCE(p_data->>'cidade',         cidade),
    uf            = COALESCE(p_data->>'uf',             uf),
    cep           = COALESCE(p_data->>'cep',            cep),
    updated_at    = now()
  WHERE id = p_company_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Empresa não encontrada ou acesso negado');
  ELSE
    result := jsonb_build_object('success', true, 'company_id', p_company_id, 'message', 'Empresa atualizada');
  END IF;
  RETURN result;
END;
$function$
