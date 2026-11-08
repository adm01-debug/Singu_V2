CREATE OR REPLACE FUNCTION public.auto_preencher_nomes_contato()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF NEW.nome_tratamento IS NULL THEN
        NEW.nome_tratamento := extrair_nome_tratamento(NEW.full_name, NEW.first_name);
    END IF;
    IF NEW.assinatura_contato IS NULL THEN
        NEW.assinatura_contato := gerar_assinatura(NEW.full_name);
    END IF;
    RETURN NEW;
END;
$function$
