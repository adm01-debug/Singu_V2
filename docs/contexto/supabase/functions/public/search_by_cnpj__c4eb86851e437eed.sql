CREATE OR REPLACE FUNCTION public.search_by_cnpj(p_cnpj text)
 RETURNS TABLE(company_id uuid, name text, cnpj text, is_customer boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, COALESCE(nome_fantasia, nome_crm), cnpj, is_customer
  FROM companies WHERE deleted_at IS NULL AND REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g') = REGEXP_REPLACE(p_cnpj, '[^0-9]', '', 'g');
$function$
