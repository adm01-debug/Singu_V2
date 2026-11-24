CREATE OR REPLACE FUNCTION public.auto_preencher_nomes_contato()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_full_name text;
BEGIN
  v_full_name := NULLIF(btrim(concat_ws(' ', NULLIF(btrim(NEW.first_name), ''), NULLIF(btrim(NEW.last_name), ''))), '');
  IF NULLIF(btrim(NEW.nome_tratamento), '') IS NULL THEN
    NEW.nome_tratamento := v_full_name;
  END IF;
  IF NULLIF(btrim(NEW.assinatura_contato), '') IS NULL THEN
    NEW.assinatura_contato := v_full_name;
  END IF;
  RETURN NEW;
END;
$function$
