-- Testes RLS — deal rooms públicos via share_token (Rodada 43/10)
-- Sandbox não permite SET ROLE anon; usamos introspecção do catálogo para
-- garantir invariantes de segurança da hardening da Rodada 41.

\set ON_ERROR_STOP on

\echo 'TEST: RLS habilitado em deal_rooms'
DO $$
DECLARE ok BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO ok
  FROM pg_class WHERE oid='public.deal_rooms'::regclass;
  IF NOT ok THEN RAISE EXCEPTION '❌ RLS desabilitado em deal_rooms'; END IF;
  RAISE NOTICE '✅ RLS ativo em deal_rooms';
END $$;

\echo 'TEST: policy dr_public_read_shared exige share_enabled=true'
DO $$
DECLARE qual TEXT;
BEGIN
  SELECT pg_get_expr(polqual, polrelid) INTO qual
  FROM pg_policy WHERE polname='dr_public_read_shared';
  IF qual IS NULL OR qual NOT ILIKE '%share_enabled%' THEN
    RAISE EXCEPTION '❌ policy dr_public_read_shared sem guard share_enabled: %', qual;
  END IF;
  RAISE NOTICE '✅ dr_public_read_shared exige share_enabled';
END $$;

\echo 'TEST: policy dr_public_increment_view é UPDATE-only'
DO $$
DECLARE cmd "char";
BEGIN
  SELECT polcmd INTO cmd FROM pg_policy WHERE polname='dr_public_increment_view';
  IF cmd <> 'w' THEN
    RAISE EXCEPTION '❌ dr_public_increment_view deveria ser UPDATE (w), é %', cmd;
  END IF;
  RAISE NOTICE '✅ dr_public_increment_view é UPDATE-only';
END $$;

\echo 'TEST: anon SEM privilégio de INSERT/DELETE em deal_rooms'
DO $$
BEGIN
  IF has_table_privilege('anon','public.deal_rooms','INSERT') THEN
    RAISE EXCEPTION '❌ anon tem INSERT em deal_rooms';
  END IF;
  IF has_table_privilege('anon','public.deal_rooms','DELETE') THEN
    RAISE EXCEPTION '❌ anon tem DELETE em deal_rooms';
  END IF;
  RAISE NOTICE '✅ anon bloqueado em INSERT/DELETE';
END $$;

\echo 'TEST: anon SEM privilégio table-wide de UPDATE (só column-level)'
DO $$
BEGIN
  IF has_table_privilege('anon','public.deal_rooms','UPDATE') THEN
    RAISE EXCEPTION '❌ anon tem UPDATE table-wide (deveria ser column-level apenas)';
  END IF;
  RAISE NOTICE '✅ anon sem UPDATE table-wide';
END $$;

\echo 'TEST: anon COM privilégio column-level em buyer_view_count e last_buyer_view_at'
DO $$
BEGIN
  IF NOT has_column_privilege('anon','public.deal_rooms','buyer_view_count','UPDATE') THEN
    RAISE EXCEPTION '❌ anon sem UPDATE em buyer_view_count';
  END IF;
  IF NOT has_column_privilege('anon','public.deal_rooms','last_buyer_view_at','UPDATE') THEN
    RAISE EXCEPTION '❌ anon sem UPDATE em last_buyer_view_at';
  END IF;
  RAISE NOTICE '✅ anon tem UPDATE apenas nas colunas de view';
END $$;

\echo 'TEST: anon SEM UPDATE em colunas sensíveis (title, share_token, user_id)'
DO $$
BEGIN
  IF has_column_privilege('anon','public.deal_rooms','title','UPDATE') THEN
    RAISE EXCEPTION '❌ anon pode alterar title';
  END IF;
  IF has_column_privilege('anon','public.deal_rooms','share_token','UPDATE') THEN
    RAISE EXCEPTION '❌ anon pode alterar share_token';
  END IF;
  IF has_column_privilege('anon','public.deal_rooms','user_id','UPDATE') THEN
    RAISE EXCEPTION '❌ anon pode alterar user_id';
  END IF;
  RAISE NOTICE '✅ colunas sensíveis protegidas de anon';
END $$;

\echo 'TEST: funções buyer são SECURITY INVOKER (Rodada 41)'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT proname, prosecdef FROM pg_proc
    WHERE pronamespace='public'::regnamespace
      AND proname IN ('get_deal_room_by_token','record_buyer_view','get_buyer_document_path')
  LOOP
    IF r.prosecdef THEN
      RAISE EXCEPTION '❌ % ainda é SECURITY DEFINER', r.proname;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ funções buyer são SECURITY INVOKER';
END $$;