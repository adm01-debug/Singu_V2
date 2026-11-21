CREATE OR REPLACE FUNCTION public.update_company_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$ BEGIN RETURN NEW; END; $function$
