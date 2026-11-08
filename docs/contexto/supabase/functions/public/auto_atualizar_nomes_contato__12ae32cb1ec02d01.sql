CREATE OR REPLACE FUNCTION public.auto_atualizar_nomes_contato()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (OLD.full_name IS DISTINCT FROM NEW.full_name)
       OR (OLD.first_name IS DISTINCT FROM NEW.first_name) THEN

        IF OLD.nome_tratamento IS NULL
           OR OLD.nome_tratamento = extrair_nome_tratamento(OLD.full_name, OLD.first_name) THEN
            NEW.nome_tratamento := extrair_nome_tratamento(NEW.full_name, NEW.first_name);
        END IF;

        IF OLD.assinatura_contato IS NULL
           OR OLD.assinatura_contato = gerar_assinatura(OLD.full_name) THEN
            NEW.assinatura_contato := gerar_assinatura(NEW.full_name);
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
