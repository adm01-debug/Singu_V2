CREATE OR REPLACE FUNCTION public.update_contact_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.search_vector :=
        -- Peso A (mais relevante): Nome completo e apelido
        setweight(to_tsvector('portuguese', COALESCE(NEW.full_name, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.apelido, '')), 'A') ||
        -- Peso B (relevante): Nome de tratamento e cargo
        setweight(to_tsvector('portuguese', COALESCE(NEW.nome_tratamento, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.cargo, '')), 'B') ||
        -- Peso C (contextual): Departamento
        setweight(to_tsvector('portuguese', COALESCE(NEW.departamento, '')), 'C') ||
        -- Peso D (complementar): Notas
        setweight(to_tsvector('portuguese', COALESCE(NEW.notes, '')), 'D');
    RETURN NEW;
END;
$function$
