CREATE OR REPLACE FUNCTION public.sync_contact_fields_dynamic()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    has_nome_completo BOOLEAN;
    has_data_nascimento BOOLEAN;
    has_observacoes BOOLEAN;
BEGIN
    -- Verificar dinamicamente quais colunas existem
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'nome_completo') INTO has_nome_completo;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'data_nascimento') INTO has_data_nascimento;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'observacoes') INTO has_observacoes;

    -- Sincronizar nome (se coluna existir)
    IF has_nome_completo THEN
        IF NEW.nome_completo IS NOT NULL AND NEW.first_name IS NULL THEN
            NEW.first_name := split_part(NEW.nome_completo, ' ', 1);
            NEW.last_name := CASE WHEN position(' ' IN NEW.nome_completo) > 0 
                THEN substring(NEW.nome_completo FROM position(' ' IN NEW.nome_completo) + 1) ELSE NULL END;
        ELSIF NEW.first_name IS NOT NULL AND NEW.nome_completo IS NULL THEN
            NEW.nome_completo := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
        END IF;
    END IF;

    -- Sincronizar data nascimento
    IF has_data_nascimento THEN
        IF NEW.data_nascimento IS NOT NULL AND NEW.birthday IS NULL THEN
            NEW.birthday := NEW.data_nascimento;
        ELSIF NEW.birthday IS NOT NULL AND NEW.data_nascimento IS NULL THEN
            NEW.data_nascimento := NEW.birthday;
        END IF;
    END IF;

    -- Sincronizar observações
    IF has_observacoes THEN
        IF NEW.observacoes IS NOT NULL AND NEW.notes IS NULL THEN
            NEW.notes := NEW.observacoes;
        ELSIF NEW.notes IS NOT NULL AND NEW.observacoes IS NULL THEN
            NEW.observacoes := NEW.notes;
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION WHEN undefined_column THEN
    -- Se alguma coluna não existir, continua sem erro
    RETURN NEW;
END;
$function$
