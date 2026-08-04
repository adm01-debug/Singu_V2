-- Security hardening: prevent anonymous role from matching user-scoped RLS policies
-- Move all policies currently applied to role 'public' in public schema to 'authenticated'
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND roles @> ARRAY['public']::name[]
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO authenticated;',
      r.policyname,
      r.schemaname,
      r.tablename
    );
  END LOOP;
END;
$$;