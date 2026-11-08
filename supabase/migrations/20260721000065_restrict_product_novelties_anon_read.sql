-- Migration: restrict_product_novelties_anon_read (Wave 151)
-- SECURITY FIX: product_novelties has an anon_read_novelties policy that grants
-- SELECT to both anon AND authenticated with USING(true).
--
-- product_novelties contains internal supplier data:
--   supplier_id, supplier_code, supplier_product_code, source, notes
-- None of this should be readable by unauthenticated (anon) callers via
-- the PostgREST REST API (/rest/v1/product_novelties).
--
-- Fix: drop the combined policy, replace with authenticated-only variant.
-- service_role retains full access via the existing service_all_novelties policy.

DO $migration$
BEGIN
  IF to_regclass('public.product_novelties') IS NOT NULL THEN
    DROP POLICY IF EXISTS anon_read_novelties ON public.product_novelties;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policy
      WHERE polrelid = to_regclass('public.product_novelties')
        AND polname = 'authenticated_read_novelties'
    ) THEN
      CREATE POLICY authenticated_read_novelties
        ON public.product_novelties
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
  END IF;
END;
$migration$;
