-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721220722
-- nome:   fix_push_subscriptions_and_shared_fields

-- Migration: fix_push_subscriptions_and_shared_fields (Wave 167)

-- ── 1. push_subscriptions ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "push_subscriptions_all" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_user_select" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_user_insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_user_update" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_user_delete" ON public.push_subscriptions;

CREATE POLICY "push_subscriptions_user_select" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_user_insert" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_user_update" ON public.push_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_user_delete" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ── 2. custom_fields — fix SELECT to include shared/global rows ───────────────
DROP POLICY IF EXISTS "custom_fields_select" ON public.custom_fields;

CREATE POLICY "custom_fields_select" ON public.custom_fields
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- ── 3. custom_field_values — same nullable user_id fix ────────────────────────
DROP POLICY IF EXISTS "custom_field_values_select" ON public.custom_field_values;

CREATE POLICY "custom_field_values_select" ON public.custom_field_values
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  bad_push int;
  bad_cf   int;
  bad_cfv  int;
BEGIN
  SELECT COUNT(*) INTO bad_push
  FROM pg_policy pol
  JOIN pg_class cl ON pol.polrelid = cl.oid
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE ns.nspname = 'public'
    AND cl.relname = 'push_subscriptions'
    AND pol.polname = 'push_subscriptions_all';

  IF bad_push = 0 THEN
    RAISE NOTICE '[Wave 167] push_subscriptions_all removed. Correct user-scoped policies in place.';
  ELSE
    RAISE WARNING '[Wave 167] push_subscriptions_all still exists!';
  END IF;

  SELECT COUNT(*) INTO bad_cf
  FROM pg_policy pol
  JOIN pg_class cl ON pol.polrelid = cl.oid
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE ns.nspname = 'public'
    AND cl.relname = 'custom_fields'
    AND pol.polname = 'custom_fields_select'
    AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%IS NULL%';

  IF bad_cf = 1 THEN
    RAISE NOTICE '[Wave 167] custom_fields_select now includes user_id IS NULL. Clean.';
  ELSE
    RAISE WARNING '[Wave 167] custom_fields_select may not have nullable user_id fix.';
  END IF;

  SELECT COUNT(*) INTO bad_cfv
  FROM pg_policy pol
  JOIN pg_class cl ON pol.polrelid = cl.oid
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE ns.nspname = 'public'
    AND cl.relname = 'custom_field_values'
    AND pol.polname = 'custom_field_values_select'
    AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%IS NULL%';

  IF bad_cfv = 1 THEN
    RAISE NOTICE '[Wave 167] custom_field_values_select now includes user_id IS NULL. Clean.';
  ELSE
    RAISE WARNING '[Wave 167] custom_field_values_select may not have nullable user_id fix.';
  END IF;
END;
$$;
