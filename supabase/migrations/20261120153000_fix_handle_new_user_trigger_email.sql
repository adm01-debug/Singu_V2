-- FIX DE PRODUCAO: producao ainda roda o handle_new_user antigo (sem email)
-- porque a correcao canonica (t208, 20260924195108) e mais antiga que o
-- ledger de producao (20261118183212) — nem o deploy nem o gate RLS a aplicam.
-- Sinais: CI build-and-test vermelho (null value in column email of relation
-- profiles violates not-null constraint) e signups novos falhando.
-- Esta migration tem versao > ledger e força o corpo correto do trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$function$;
