CREATE OR REPLACE FUNCTION public.companies_search_vector_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.nome_crm, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.razao_social, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.nome_fantasia, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.cnpj, '')), 'A');
  RETURN NEW;
END;
$function$
