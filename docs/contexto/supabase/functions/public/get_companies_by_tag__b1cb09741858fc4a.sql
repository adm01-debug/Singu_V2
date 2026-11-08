CREATE OR REPLACE FUNCTION public.get_companies_by_tag(p_tag text, p_limit integer DEFAULT 100)
 RETURNS TABLE(company_id uuid, name text, cnpj text, tags text[])
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, COALESCE(nome_fantasia, nome_crm), cnpj, tags_array FROM companies WHERE p_tag = ANY(tags_array) AND deleted_at IS NULL LIMIT p_limit;
$function$
