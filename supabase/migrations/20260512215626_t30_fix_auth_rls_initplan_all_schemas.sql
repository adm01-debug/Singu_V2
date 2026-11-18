-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260512215626
-- nome:   t30_fix_auth_rls_initplan_all_schemas

-- T30: Fix auth_rls_initplan in ALL remaining schemas
-- Fixes bare auth.uid() and alias form (SELECT auth.uid() AS uid)
-- → canonical (SELECT auth.uid()) across public, _dormant, zapp_history, storage
-- Strategy: protective replace — canonical form preserved, alias+bare forms corrected

DO $$
DECLARE
  rec    RECORD;
  nq     TEXT;
  nc     TEXT;
  stmt   TEXT;
  cnt    INT := 0;
BEGIN
  FOR rec IN
    SELECT schemaname, tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE (
        (qual IS NOT NULL
          AND qual ILIKE '%auth.uid()%'
          AND qual NOT ILIKE '%(SELECT auth.uid())%')
      OR
        (with_check IS NOT NULL
          AND with_check ILIKE '%auth.uid()%'
          AND with_check NOT ILIKE '%(SELECT auth.uid())%')
    )
    AND schemaname NOT IN ('pg_catalog','information_schema')
    ORDER BY schemaname, tablename, policyname
  LOOP
    -- ── Fix USING clause ─────────────────────────────────────────────────
    IF rec.qual IS NOT NULL
       AND rec.qual ILIKE '%auth.uid()%'
       AND rec.qual NOT ILIKE '%(SELECT auth.uid())%'
    THEN
      nq := rec.qual;
      nq := replace(nq, '(SELECT auth.uid())',        '__AUID__');   -- protect canonical
      nq := replace(nq, '( SELECT auth.uid() AS uid)','__AUID__');   -- fix alias
      nq := replace(nq, 'auth.uid()',                  '(SELECT auth.uid())');  -- fix bare
      nq := replace(nq, '__AUID__',                   '(SELECT auth.uid())');  -- restore
    ELSE
      nq := NULL;
    END IF;

    -- ── Fix WITH CHECK clause ─────────────────────────────────────────────
    IF rec.with_check IS NOT NULL
       AND rec.with_check ILIKE '%auth.uid()%'
       AND rec.with_check NOT ILIKE '%(SELECT auth.uid())%'
    THEN
      nc := rec.with_check;
      nc := replace(nc, '(SELECT auth.uid())',        '__AUID__');
      nc := replace(nc, '( SELECT auth.uid() AS uid)','__AUID__');
      nc := replace(nc, 'auth.uid()',                  '(SELECT auth.uid())');
      nc := replace(nc, '__AUID__',                   '(SELECT auth.uid())');
    ELSE
      nc := NULL;
    END IF;

    -- ── Build and execute ALTER POLICY ────────────────────────────────────
    stmt := format('ALTER POLICY %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
    IF nq IS NOT NULL THEN
      stmt := stmt || ' USING (' || nq || ')';
    END IF;
    IF nc IS NOT NULL THEN
      stmt := stmt || ' WITH CHECK (' || nc || ')';
    END IF;

    EXECUTE stmt;
    cnt := cnt + 1;
  END LOOP;

  RAISE NOTICE 'T30: Fixed % auth_rls_initplan violations', cnt;
END $$;
