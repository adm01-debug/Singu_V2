CREATE OR REPLACE FUNCTION public.upsert_company(p_cnpj text, p_nome_crm text, p_email text DEFAULT NULL::text, p_telefone text DEFAULT NULL::text, p_endereco text DEFAULT NULL::text, p_cidade text DEFAULT NULL::text, p_uf text DEFAULT NULL::text, p_cep text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result jsonb;
  existing_id uuid;
  new_id uuid;
  clean_cnpj text;
BEGIN
  clean_cnpj := REGEXP_REPLACE(p_cnpj, '[^0-9]', '', 'g');

  SELECT id INTO existing_id
  FROM companies
  WHERE REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g') = clean_cnpj AND deleted_at IS NULL
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    -- Caller must own the existing company before updating it
    PERFORM public.assert_company_access(existing_id);

    UPDATE companies SET
      nome_crm   = COALESCE(p_nome_crm, nome_crm),
      email      = COALESCE(p_email, email),
      telefone   = COALESCE(p_telefone, telefone),
      endereco   = COALESCE(p_endereco, endereco),
      cidade     = COALESCE(p_cidade, cidade),
      uf         = COALESCE(p_uf, uf),
      cep        = COALESCE(p_cep, cep),
      updated_at = now()
    WHERE id = existing_id;

    SELECT jsonb_build_object('success', true, 'action', 'updated', 'company_id', existing_id)
    INTO result;
  ELSE
    INSERT INTO companies (cnpj, nome_crm, email, telefone, endereco, cidade, uf, cep, status, user_id)
    VALUES (p_cnpj, p_nome_crm, p_email, p_telefone, p_endereco, p_cidade, p_uf, p_cep, 'ativo', auth.uid())
    RETURNING id INTO new_id;

    SELECT jsonb_build_object('success', true, 'action', 'created', 'company_id', new_id)
    INTO result;
  END IF;

  RETURN result;
END;
$function$
