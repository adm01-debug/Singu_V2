-- Wave 177: Restore SECURITY DEFINER for auth-chain trigger functions
-- handle_new_user fires on auth.users INSERT (cross-schema trigger — auth.uid() is NULL in that
-- context, so SECURITY INVOKER breaks profile creation for every new signup).
-- handle_new_singu_profile fires on public.profiles INSERT that handle_new_user initiates.
-- Both must remain SECURITY DEFINER so they run as postgres (owner) and bypass RLS.

DO $migration$
DECLARE
  function_signature text;
BEGIN
  FOREACH function_signature IN ARRAY ARRAY[
    'public.handle_new_user()',
    'public.handle_new_singu_profile()'
  ]
  LOOP
    IF to_regprocedure(function_signature) IS NOT NULL THEN
      EXECUTE format(
        'ALTER FUNCTION %s SECURITY DEFINER',
        function_signature
      );
      EXECUTE format(
        'ALTER FUNCTION %s SET search_path = public, auth, extensions',
        function_signature
      );
    END IF;
  END LOOP;
END;
$migration$;
