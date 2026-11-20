-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321185639
-- nome:   fix_handle_new_user_trigger

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
    ;
    
    -- If email conflict (different user with same email), update the existing row
    IF NOT FOUND THEN
        UPDATE profiles SET id = NEW.id WHERE email = NEW.email;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Email already exists with different id — update to new user id
        UPDATE profiles SET id = NEW.id, email = NEW.email WHERE email = NEW.email;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Never block user creation
        RAISE LOG 'handle_new_user error: % %', SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$;
