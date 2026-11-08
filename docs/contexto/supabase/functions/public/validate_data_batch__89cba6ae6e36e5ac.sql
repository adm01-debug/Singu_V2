CREATE OR REPLACE FUNCTION public.validate_data_batch(p_table text DEFAULT 'companies'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF p_table = 'companies' THEN
    SELECT jsonb_build_object(
      'table', 'companies',
      'total', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'problemas', jsonb_build_object(
        'sem_nome', (SELECT COUNT(*) FROM companies WHERE (nome_crm IS NULL OR nome_crm = '') AND deleted_at IS NULL),
        'sem_cnpj', (SELECT COUNT(*) FROM companies WHERE (cnpj IS NULL OR cnpj = '') AND deleted_at IS NULL),
        'cnpj_invalido', (SELECT COUNT(*) FROM companies WHERE cnpj IS NOT NULL AND LENGTH(REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g')) NOT IN (11, 14) AND deleted_at IS NULL),
        'sem_email', (SELECT COUNT(*) FROM companies WHERE (email IS NULL OR email = '') AND deleted_at IS NULL),
        'sem_telefone', (SELECT COUNT(*) FROM companies WHERE (telefone IS NULL OR telefone = '') AND deleted_at IS NULL),
        'sem_uf', (SELECT COUNT(*) FROM companies WHERE (uf IS NULL OR uf = '') AND deleted_at IS NULL)
      )
    ) INTO result;
  ELSIF p_table = 'contacts' THEN
    SELECT jsonb_build_object(
      'table', 'contacts',
      'total', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'problemas', jsonb_build_object(
        'sem_nome', (SELECT COUNT(*) FROM contacts WHERE (full_name IS NULL OR full_name = '') AND deleted_at IS NULL),
        'sem_empresa', (SELECT COUNT(*) FROM contacts WHERE company_id IS NULL AND deleted_at IS NULL),
        'sem_email_e_telefone', (SELECT COUNT(*) FROM contacts WHERE (email IS NULL OR email = '') AND (telefone IS NULL OR telefone = '') AND deleted_at IS NULL)
      )
    ) INTO result;
  ELSIF p_table = 'customers' THEN
    SELECT jsonb_build_object(
      'table', 'customers',
      'total', (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL),
      'problemas', jsonb_build_object(
        'sem_empresa', (SELECT COUNT(*) FROM customers WHERE company_id IS NULL AND deleted_at IS NULL),
        'sem_vendedor', (SELECT COUNT(*) FROM customers WHERE vendedor_id IS NULL AND deleted_at IS NULL),
        'valores_negativos', (SELECT COUNT(*) FROM customers WHERE (valor_total_compras < 0 OR ticket_medio < 0) AND deleted_at IS NULL)
      )
    ) INTO result;
  ELSE
    result := jsonb_build_object('error', 'Tabela não suportada. Use: companies, contacts, customers');
  END IF;
  
  RETURN result;
END;
$function$
