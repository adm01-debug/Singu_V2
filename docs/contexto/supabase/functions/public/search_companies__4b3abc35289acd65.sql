CREATE OR REPLACE FUNCTION public.search_companies(search_term text, max_results integer)
 RETURNS TABLE(id uuid, nome_fantasia text, razao_social text, cnpj text, status text, is_customer boolean)
 LANGUAGE plpgsql
AS $function$ BEGIN
  RETURN QUERY SELECT NULL::uuid AS id, NULL::text AS nome_fantasia, NULL::text AS razao_social, NULL::text AS cnpj, NULL::text AS status, NULL::boolean AS is_customer LIMIT 0;
END; $function$
