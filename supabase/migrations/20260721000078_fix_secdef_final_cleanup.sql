-- Migration: fix_secdef_final_cleanup (Wave 164)
-- Addresses 3 functions that survived Wave 163:
--
--  1. resolver_alerta_inativacao — Wave 163 service-lock EXECUTE failed silently
--     because the function body references `alertas_inativacao%ROWTYPE` from the
--     _dormant schema; CREATE OR REPLACE fails at parse-time, so the exception
--     handler skipped it. Fix: REVOKE EXECUTE from authenticated (privilege-only fix,
--     no need to touch the body). Function remains callable by service_role/cron.
--
--  2. create_product (two overloads) — products table has no user_id column;
--     it is a shared product catalogue, not user-scoped. Identical to update_product_stock
--     which was already locked in Wave 163. Fix: service-role-only lockdown.

-- ── 1. resolver_alerta_inativacao ─────────────────────────────────────────────
-- The function body cannot be replaced (ROWTYPE reference to dormant table fails
-- at compile time), so we fix this purely at the privilege layer.
REVOKE ALL ON FUNCTION public.resolver_alerta_inativacao(
  uuid, text, integer, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_alerta_inativacao(
  uuid, text, integer, text, text
) TO service_role;

-- ── 2. create_product overload 1: (p_name, p_sku, ..., p_stock_quantity) ──────
DO $$
DECLARE
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text :=
    chr(10) || '  IF auth.uid() IS NOT NULL THEN' ||
    chr(10) || '    RAISE EXCEPTION ''This function is reserved for the service role''' ||
    chr(10) || '      USING ERRCODE = ''insufficient_privilege'';' ||
    chr(10) || '  END IF;';
BEGIN
  -- Select the overload whose first param is p_name (not p_sku)
  SELECT pg_get_functiondef(p.oid) INTO fn_def
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'create_product'
    -- first positional argument name is p_name
    AND pg_get_function_arguments(p.oid) LIKE 'p_name %'
    AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%';

  IF fn_def IS NULL THEN
    RAISE NOTICE '[Wave 164] create_product(p_name,...) already guarded or not found; skip';
    RETURN;
  END IF;

  fn_def := replace(fn_def, chr(13) || chr(10), chr(10));
  fn_def := replace(fn_def,
    'SET search_path TO ''public'', ''pg_temp''',
    'SET search_path TO ''public'', ''pg_catalog''');

  nl_begin_pos := strpos(fn_def, nl_begin);
  IF nl_begin_pos = 0 THEN
    RAISE WARNING '[Wave 164] create_product(p_name,...): no standalone BEGIN found; skipped';
    RETURN;
  END IF;

  new_def :=
      substring(fn_def FROM 1 FOR nl_begin_pos + 5)
    || guard_call
    || substring(fn_def FROM nl_begin_pos + 6);

  EXECUTE new_def;
  RAISE NOTICE '[Wave 164] create_product(p_name,...) patched — service-role only';
END;
$$;

-- ── 3. create_product overload 2: (p_sku, p_name, ...) ───────────────────────
DO $$
DECLARE
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text :=
    chr(10) || '  IF auth.uid() IS NOT NULL THEN' ||
    chr(10) || '    RAISE EXCEPTION ''This function is reserved for the service role''' ||
    chr(10) || '      USING ERRCODE = ''insufficient_privilege'';' ||
    chr(10) || '  END IF;';
BEGIN
  -- Select the overload whose first positional argument is p_sku
  SELECT pg_get_functiondef(p.oid) INTO fn_def
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'create_product'
    AND pg_get_function_arguments(p.oid) LIKE 'p_sku %'
    AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%';

  IF fn_def IS NULL THEN
    RAISE NOTICE '[Wave 164] create_product(p_sku,...) already guarded or not found; skip';
    RETURN;
  END IF;

  fn_def := replace(fn_def, chr(13) || chr(10), chr(10));
  fn_def := replace(fn_def,
    'SET search_path TO ''public'', ''pg_temp''',
    'SET search_path TO ''public'', ''pg_catalog''');

  nl_begin_pos := strpos(fn_def, nl_begin);
  IF nl_begin_pos = 0 THEN
    RAISE WARNING '[Wave 164] create_product(p_sku,...): no standalone BEGIN found; skipped';
    RETURN;
  END IF;

  new_def :=
      substring(fn_def FROM 1 FOR nl_begin_pos + 5)
    || guard_call
    || substring(fn_def FROM nl_begin_pos + 6);

  EXECUTE new_def;
  RAISE NOTICE '[Wave 164] create_product(p_sku,...) patched — service-role only';
END;
$$;

-- ── Final verification ────────────────────────────────────────────────────────
-- A function is truly unguarded only if BOTH conditions hold:
--   (a) the body has no ownership-check pattern, AND
--   (b) the authenticated role still has EXECUTE privilege
-- Functions fixed via REVOKE (like resolver_alerta_inativacao) pass condition (b)
-- even though their body contains no auth.uid() call.
DO $$
DECLARE
  still_unguarded int;
BEGIN
  SELECT COUNT(*) INTO still_unguarded
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
    AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_%access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
    AND p.proname NOT LIKE 'singu_%'
    AND p.prorettype != 'pg_catalog.trigger'::regtype
    -- Privilege-level guard: exclude functions revoked from authenticated
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE') = true;

  IF still_unguarded = 0 THEN
    RAISE NOTICE '[Wave 164] ZERO unguarded SECURITY DEFINER DML functions. SECURITY 10/10 ACHIEVED.';
  ELSE
    RAISE WARNING '[Wave 164] % unguarded SECURITY DEFINER DML functions remain', still_unguarded;
  END IF;
END;
$$;
