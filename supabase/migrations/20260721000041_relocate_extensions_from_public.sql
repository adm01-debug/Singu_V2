-- Migration: relocate_extensions_from_public (Wave 127)
-- Addresses extension_in_public advisor warnings by moving 3 relocatable
-- extensions from `public` to the `extensions` schema.
-- Benefits:
--   1. Removes extension functions/operators from the public REST API surface.
--   2. Follows Supabase best practice for extension placement.
--   3. Existing column types (vector), indexes (gin_trgm_ops), and function
--      calls continue to work because:
--        a. OIDs are preserved — column type definitions and index operator
--           classes reference by OID, not schema-qualified name.
--        b. `extensions` is already in the database search_path
--           (public, _dormant, extensions), so unqualified references resolve.
--
-- pg_net is NOT relocated here because extrelocatable=false for that extension.
-- It is a Supabase-managed extension that must remain in public.

DO $migration$
DECLARE
  extension_name text;
BEGIN
  FOREACH extension_name IN ARRAY ARRAY['pg_trgm', 'unaccent', 'vector']
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_extension
      WHERE extname = extension_name
        AND extrelocatable
        AND extnamespace <> 'extensions'::regnamespace
    ) THEN
      EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', extension_name);
    END IF;
  END LOOP;
END;
$migration$;
