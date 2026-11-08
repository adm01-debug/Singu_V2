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
