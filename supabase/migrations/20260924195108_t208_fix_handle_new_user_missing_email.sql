-- BUG DE PRODUCAO: handle_new_user() nao populava profiles.email (NOT NULL, sem default).
-- Resultado: TODO signup novo no Singu falhava com "null value in column email violates not-null constraint".
-- Reproduzido em 24/09 tentando criar um usuario de teste via Auth admin API.
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