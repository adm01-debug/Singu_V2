CREATE OR REPLACE FUNCTION public.update_company_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('portuguese', COALESCE(NEW.razao_social, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.nome_fantasia, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.nome_crm, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.cnpj, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.ramo_atividade, '')), 'D');
    RETURN NEW;
END;
$function$
