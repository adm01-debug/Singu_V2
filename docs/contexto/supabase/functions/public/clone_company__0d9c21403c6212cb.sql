CREATE OR REPLACE FUNCTION public.clone_company(p_source_company_id uuid, p_new_name text, p_clone_contacts boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result jsonb;
  new_company_id uuid;
  source_company record;
BEGIN
  PERFORM public.assert_company_access(p_source_company_id);

  SELECT * INTO source_company FROM companies WHERE id = p_source_company_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Empresa origem não encontrada');
  END IF;

  INSERT INTO companies (
    nome_crm, razao_social, nome_fantasia, cnpj, email, telefone,
    endereco, cidade, uf, cep, status, user_id
  )
  SELECT
    p_new_name, razao_social, nome_fantasia, NULL, email, telefone,
    endereco, cidade, uf, cep, 'ativo', auth.uid()
  FROM companies WHERE id = p_source_company_id
  RETURNING id INTO new_company_id;

  IF p_clone_contacts THEN
    INSERT INTO contacts (company_id, full_name, email, telefone, cargo, whatsapp, user_id)
    SELECT new_company_id, full_name, email, telefone, cargo, whatsapp, auth.uid()
    FROM contacts WHERE company_id = p_source_company_id AND deleted_at IS NULL;
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'new_company_id', new_company_id,
    'source_company_id', p_source_company_id,
    'contacts_cloned', p_clone_contacts,
    'message', 'Empresa clonada com sucesso'
  ) INTO result;

  RETURN result;
END;
$function$
