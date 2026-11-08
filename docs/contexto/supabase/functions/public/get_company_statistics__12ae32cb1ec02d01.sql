CREATE OR REPLACE FUNCTION public.get_company_statistics()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total', (SELECT count(*) FROM companies),
    'com_cnpj', (SELECT count(*) FROM companies WHERE cnpj IS NOT NULL AND cnpj != ''),
    'com_phone', (SELECT count(DISTINCT company_id) FROM company_phones),
    'com_email', (SELECT count(DISTINCT company_id) FROM company_emails),
    'is_customer', (SELECT count(*) FROM companies WHERE is_customer = true),
    'is_supplier', (SELECT count(*) FROM companies WHERE is_supplier = true),
    'is_carrier', (SELECT count(*) FROM companies WHERE is_carrier = true),
    'com_grupo_economico', (SELECT count(*) FROM companies WHERE grupo_economico_id IS NOT NULL),
    'com_nome_fantasia', (SELECT count(*) FROM companies WHERE nome_fantasia IS NOT NULL AND nome_fantasia != ''),
    'razao_social_duplicadas', (SELECT count(*) FROM (
      SELECT razao_social FROM companies 
      WHERE razao_social IS NOT NULL GROUP BY razao_social HAVING count(*) > 1
    ) t)
  ) INTO result;
  RETURN result;
END;
$function$
