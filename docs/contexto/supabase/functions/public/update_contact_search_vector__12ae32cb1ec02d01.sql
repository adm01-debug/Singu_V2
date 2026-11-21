CREATE OR REPLACE FUNCTION public.update_contact_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$ BEGIN RETURN NEW; END; $function$
