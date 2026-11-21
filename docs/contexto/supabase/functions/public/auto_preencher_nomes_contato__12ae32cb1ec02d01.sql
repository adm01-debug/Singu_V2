CREATE OR REPLACE FUNCTION public.auto_preencher_nomes_contato()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$ BEGIN RETURN NEW; END; $function$
