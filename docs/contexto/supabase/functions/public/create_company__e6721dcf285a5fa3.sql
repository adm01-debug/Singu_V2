CREATE OR REPLACE FUNCTION public.create_company(p_nome_crm text, p_cnpj text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_telefone text DEFAULT NULL::text, p_endereco text DEFAULT NULL::text, p_cidade text DEFAULT NULL::text, p_uf text DEFAULT NULL::text, p_cep text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result jsonb;
  new_id uuid;
BEGIN
  INSERT INTO companies (nome_crm, cnpj, status, user_id)
  VALUES (p_nome_crm, p_cnpj, 'ativo', auth.uid())
  RETURNING id INTO new_id;

  -- dados de contato/endereço vivem em tabelas normalizadas no canônico
  IF p_email IS NOT NULL THEN
    INSERT INTO company_emails (company_id, email, email_type, is_primary)
    VALUES (new_id, p_email, 'corporativo', true);
  END IF;
  IF p_telefone IS NOT NULL THEN
    INSERT INTO company_phones (company_id, numero, phone_type, is_primary)
    VALUES (new_id, p_telefone, 'fixo_comercial', true);
  END IF;
  IF p_endereco IS NOT NULL OR p_cidade IS NOT NULL OR p_uf IS NOT NULL OR p_cep IS NOT NULL THEN
    INSERT INTO company_addresses (company_id, tipo, is_primary, logradouro, cidade, estado, cep)
    VALUES (new_id, 'principal', true, p_endereco, p_cidade, p_uf, p_cep);
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'company_id', new_id,
    'nome_crm', p_nome_crm,
    'message', 'Empresa criada com sucesso'
  ) INTO result;

  RETURN result;
END;
$function$
