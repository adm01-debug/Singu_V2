CREATE OR REPLACE FUNCTION public.update_company_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', concat_ws(' ',
      NEW.nome_crm, NEW.razao_social, NEW.nome_fantasia, NEW.ramo_atividade,
      NEW.industry, NEW.grupo_economico
    )), 'A')
    || setweight(to_tsvector('simple', concat_ws(' ',
      NEW.cnpj, NEW.cnpj_base, NEW.website, NEW.inscricao_estadual
    )), 'B');
  RETURN NEW;
END;
$function$
