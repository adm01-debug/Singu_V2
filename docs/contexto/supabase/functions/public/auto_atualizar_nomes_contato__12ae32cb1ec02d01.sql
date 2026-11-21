CREATE OR REPLACE FUNCTION public.auto_atualizar_nomes_contato()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$ BEGIN RETURN NEW; END; $function$
