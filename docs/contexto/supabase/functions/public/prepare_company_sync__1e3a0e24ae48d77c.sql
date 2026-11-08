CREATE OR REPLACE FUNCTION public.prepare_company_sync(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'company_id', c.id,
    'cnpj', c.cnpj,
    'nome', COALESCE(c.nome_fantasia, c.nome_crm),
    'razao_social', c.razao_social,
    'email', (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary LIMIT 1),
    'telefone', (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary LIMIT 1),
    'endereco', (SELECT jsonb_build_object('cidade', ca.cidade, 'estado', ca.estado, 'cep', ca.cep) FROM company_addresses ca WHERE ca.company_id = c.id LIMIT 1),
    'responsavel_id', c.user_id,
    'is_customer', c.is_customer,
    'created_at', c.created_at,
    'sync_timestamp', NOW()
  ) INTO v_result
  FROM companies c WHERE c.id = p_company_id;
  RETURN v_result;
END;
$function$
