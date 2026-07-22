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

ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;
ALTER EXTENSION vector    SET SCHEMA extensions;
