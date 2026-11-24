CREATE OR REPLACE FUNCTION public.auto_atualizar_nomes_contato()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_old_full_name text;
  v_new_full_name text;
BEGIN
  v_old_full_name := NULLIF(btrim(concat_ws(' ', NULLIF(btrim(OLD.first_name), ''), NULLIF(btrim(OLD.last_name), ''))), '');
  v_new_full_name := NULLIF(btrim(concat_ws(' ', NULLIF(btrim(NEW.first_name), ''), NULLIF(btrim(NEW.last_name), ''))), '');

  IF NEW.first_name IS DISTINCT FROM OLD.first_name
     OR NEW.last_name IS DISTINCT FROM OLD.last_name THEN
    IF NULLIF(btrim(OLD.nome_tratamento), '') IS NULL
       OR btrim(OLD.nome_tratamento) = v_old_full_name THEN
      NEW.nome_tratamento := v_new_full_name;
    END IF;
    IF NULLIF(btrim(OLD.assinatura_contato), '') IS NULL
       OR btrim(OLD.assinatura_contato) = v_old_full_name THEN
      NEW.assinatura_contato := v_new_full_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
