-- 1. Create a dedicated extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Move pg_net extension to the extensions schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        ALTER EXTENSION pg_net SET SCHEMA extensions;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not move pg_net to extensions schema: %', SQLERRM;
END $$;

-- 3. Secure SECURITY DEFINER functions by setting an explicit search_path
-- Using pg_get_function_identity_arguments to avoid syntax errors with DEFAULT values
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, nspname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.prosecdef = true AND n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp', 
                       func_record.proname, 
                       func_record.args);
    END LOOP;
END $$;