CREATE OR REPLACE FUNCTION public.onboard_new_company(p_nome_crm text, p_cnpj text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_telefone text DEFAULT NULL::text, p_cidade text DEFAULT NULL::text, p_uf text DEFAULT NULL::text, p_contato_nome text DEFAULT NULL::text, p_contato_email text DEFAULT NULL::text, p_contato_telefone text DEFAULT NULL::text, p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result jsonb;
  new_company_id uuid;
  new_contact_id uuid;
  new_customer_id uuid;
BEGIN
  INSERT INTO companies (nome_crm, cnpj, email, telefone, cidade, uf, status, user_id)
  VALUES (p_nome_crm, p_cnpj, p_email, p_telefone, p_cidade, p_uf, 'ativo', auth.uid())
  RETURNING id INTO new_company_id;

  IF p_contato_nome IS NOT NULL THEN
    INSERT INTO contacts (company_id, full_name, email, telefone, user_id)
    VALUES (new_company_id, p_contato_nome, p_contato_email, p_contato_telefone, auth.uid())
    RETURNING id INTO new_contact_id;
  END IF;

  INSERT INTO customers (company_id, vendedor_id, cliente_ativado, ja_comprou)
  VALUES (new_company_id, p_vendedor_id, false, false)
  RETURNING id INTO new_customer_id;

  SELECT jsonb_build_object(
    'success', true,
    'company_id', new_company_id,
    'contact_id', new_contact_id,
    'customer_id', new_customer_id,
    'message', 'Onboarding completo realizado'
  ) INTO result;

  RETURN result;
END;
$function$
