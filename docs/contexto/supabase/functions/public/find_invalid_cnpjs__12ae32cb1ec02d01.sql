CREATE OR REPLACE FUNCTION public.find_invalid_cnpjs()
 RETURNS TABLE(company_id uuid, name text, cnpj text, issue text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, COALESCE(nome_fantasia, nome_crm), cnpj,
    CASE 
      WHEN cnpj IS NULL OR cnpj = '' THEN 'CNPJ vazio'
      WHEN LENGTH(REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g')) != 14 THEN 'Tamanho inválido'
      ELSE 'Formato inválido'
    END
  FROM companies WHERE deleted_at IS NULL AND (cnpj IS NULL OR cnpj = '' OR LENGTH(REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g')) != 14)
  ORDER BY created_at DESC;
$function$
