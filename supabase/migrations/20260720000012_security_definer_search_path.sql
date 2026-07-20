-- Migration: Set search_path on all SECURITY DEFINER functions that are missing it
--
-- Without an explicit search_path, SECURITY DEFINER functions run with their
-- caller's search_path, which can be hijacked by an attacker who creates public
-- schema objects with the same name as internal/system functions. Pinning
-- search_path = public eliminates this attack vector.
--
-- This DO block dynamically patches every existing function in the public schema
-- that is SECURITY DEFINER and has no search_path already set, so:
--   1. We don't need to copy/paste 112 function bodies.
--   2. Any new SECURITY DEFINER functions added in future migrations should also
--      include "SET search_path = public" in their definition.

DO $$
DECLARE
  r        RECORD;
  sig      TEXT;
  patched  INT := 0;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS signature
    FROM   pg_proc      p
    JOIN   pg_namespace n ON n.oid = p.pronamespace
    WHERE  n.nspname   = 'public'
      AND  p.prosecdef = true
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1
          FROM   unnest(p.proconfig) AS cfg
          WHERE  cfg LIKE 'search_path=%'
        )
      )
  LOOP
    sig := r.signature::text;
    EXECUTE format('ALTER FUNCTION %s SET search_path TO public', sig);
    patched := patched + 1;
  END LOOP;

  RAISE NOTICE 'Patched % SECURITY DEFINER function(s) with SET search_path = public', patched;
END;
$$;
