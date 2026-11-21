CREATE OR REPLACE FUNCTION public.search_contacts(search_term text, max_results integer)
 RETURNS TABLE(id uuid, full_name text, first_name text, last_name text, company_id uuid)
 LANGUAGE plpgsql
AS $function$ BEGIN
  RETURN QUERY SELECT NULL::uuid AS id, NULL::text AS full_name, NULL::text AS first_name, NULL::text AS last_name, NULL::uuid AS company_id LIMIT 0;
END; $function$
