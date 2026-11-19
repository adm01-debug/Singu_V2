-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721210754
-- nome:   fix_secdef_trigger_fn_revoke

-- Migration: fix_secdef_trigger_fn_revoke (Wave 159)
-- SECURITY FIX: 13 SECURITY DEFINER trigger functions in the public schema
-- have EXECUTE accessible to PUBLIC/anon/authenticated via the default
-- PostgreSQL privilege model.
--
-- Trigger functions (RETURNS trigger) are called exclusively by the PostgreSQL
-- trigger machinery — they should NEVER be invocable directly by any user role.
-- Revoking EXECUTE from PUBLIC, anon, and authenticated:
--   • Eliminates the Supabase advisor lint for these functions
--   • Prevents any possibility of direct REST-API invocation
--   • Does NOT affect trigger execution (triggers are called as postgres/owner)
--
-- Also revokes PUBLIC/anon from internal helper get_singu_allowed_tables,
-- which is an implementation detail of singu_* functions and never meant
-- for direct user calls.

-- ── Trigger functions ─────────────────────────────────────────────────────────
DO $fncheck$
DECLARE fn_name text;
BEGIN
  FOREACH fn_name IN ARRAY ARRAY['audit_companies_trigger','audit_trigger_fn','audit_trigger_func',
    'auto_calculate_lead_score','companies_search_vector_update','fn_set_novelty_updated_at',
    'fn_sync_novelty_to_product','handle_new_singu_profile','handle_new_user','log_deal_status_change',
    'mark_customer_on_deal_won','set_updated_at','singu_audit_trigger_fn']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
               WHERE n.nspname='public' AND p.proname=fn_name) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%I() FROM PUBLIC, anon, authenticated', fn_name);
    END IF;
  END LOOP;
END;
$fncheck$;

-- ── Internal helpers ──────────────────────────────────────────────────────────
-- get_singu_allowed_tables is called internally by singu_* SECURITY DEFINER
-- functions; direct user calls return no sensitive data but are pointless.
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='get_singu_allowed_tables') THEN
    REVOKE ALL ON FUNCTION public.get_singu_allowed_tables() FROM PUBLIC, anon;
  END IF;
END;
$fncheck$;
DO $grant$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='get_singu_allowed_tables') THEN
    GRANT EXECUTE ON FUNCTION public.get_singu_allowed_tables() TO service_role;
  END IF;
END;
$grant$;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  accessible_trigger_fns int;
BEGIN
  -- Check if any trigger-return SECURITY DEFINER functions still have
  -- EXECUTE granted to authenticated/anon
  SELECT COUNT(*) INTO accessible_trigger_fns
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prorettype = 'pg_catalog.trigger'::regtype
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE');

  IF accessible_trigger_fns > 0 THEN
    RAISE WARNING '[Wave 159] % trigger functions still accessible to authenticated', accessible_trigger_fns;
  ELSE
    RAISE NOTICE '[Wave 159] All trigger SECURITY DEFINER functions locked down. Clean.';
  END IF;
END;
$$;
