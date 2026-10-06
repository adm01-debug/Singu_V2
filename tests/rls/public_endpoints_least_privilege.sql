-- Rodada 44/10 — Least Privilege em endpoints públicos.
-- Garante que anon tem APENAS os privilégios mínimos necessários para as
-- rotas públicas funcionarem, sem herança de INSERT/UPDATE/DELETE table-wide.
\set ON_ERROR_STOP on

\echo 'TEST: anon read-only em forms/lead_magnets/landing_pages'
DO $$
DECLARE r TEXT;
BEGIN
  FOREACH r IN ARRAY ARRAY['forms','lead_magnets','landing_pages'] LOOP
    IF NOT has_any_column_privilege('anon','public.'||r,'SELECT') THEN
      RAISE EXCEPTION '❌ anon sem SELECT em %', r; END IF;
    IF has_table_privilege('anon','public.'||r,'INSERT')
       OR has_table_privilege('anon','public.'||r,'UPDATE')
       OR has_table_privilege('anon','public.'||r,'DELETE') THEN
      RAISE EXCEPTION '❌ anon tem privilégio de escrita em %', r; END IF;
  END LOOP;
  RAISE NOTICE '✅ anon read-only em forms/lead_magnets/landing_pages';
END $$;

\echo 'TEST: anon sem acesso a form_submissions/lead_magnet_downloads/deal_room_activities'
DO $$
DECLARE r TEXT;
BEGIN
  FOREACH r IN ARRAY ARRAY['form_submissions','lead_magnet_downloads','deal_room_activities'] LOOP
    IF has_table_privilege('anon','public.'||r,'SELECT')
       OR has_table_privilege('anon','public.'||r,'INSERT')
       OR has_table_privilege('anon','public.'||r,'UPDATE')
       OR has_table_privilege('anon','public.'||r,'DELETE') THEN
      RAISE EXCEPTION '❌ anon ainda tem privilégio em %', r; END IF;
  END LOOP;
  RAISE NOTICE '✅ anon totalmente bloqueado nas tabelas de captura via edge function';
END $$;

\echo 'TEST: anon apenas INSERT em landing_page_submissions'
DO $$
BEGIN
  IF NOT has_table_privilege('anon','public.landing_page_submissions','INSERT') THEN
    RAISE EXCEPTION '❌ anon sem INSERT em landing_page_submissions'; END IF;
  IF has_table_privilege('anon','public.landing_page_submissions','SELECT')
     OR has_table_privilege('anon','public.landing_page_submissions','UPDATE')
     OR has_table_privilege('anon','public.landing_page_submissions','DELETE') THEN
    RAISE EXCEPTION '❌ anon tem privilégio além de INSERT em landing_page_submissions'; END IF;
  RAISE NOTICE '✅ anon apenas INSERT em landing_page_submissions';
END $$;
\echo 'TEST: página pública de formulário lê só colunas públicas como anon'
SET ROLE anon;
DO $$
BEGIN
  PERFORM id, name, slug, description, fields, redirect_url, success_message, is_published
    FROM public.forms WHERE is_published LIMIT 1;
  BEGIN
    PERFORM routing_rules FROM public.forms LIMIT 1;
    RAISE EXCEPTION '❌ anon lê forms.routing_rules';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM nurturing_workflow_id FROM public.forms LIMIT 1;
    RAISE EXCEPTION '❌ anon lê forms.nurturing_workflow_id';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE '✅ anon lê só as colunas públicas de forms';
END $$;
RESET ROLE;

\echo 'TEST: anon lê só as colunas públicas de lead_magnets (download só pela RPC)'
SET ROLE anon;
DO $$
BEGIN
  PERFORM id, title, slug, description, type, thumbnail_url, is_published
    FROM public.lead_magnets WHERE is_published LIMIT 1;
  BEGIN
    PERFORM file_path FROM public.lead_magnets LIMIT 1;
    RAISE EXCEPTION '❌ anon lê lead_magnets.file_path';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM external_url FROM public.lead_magnets LIMIT 1;
    RAISE EXCEPTION '❌ anon lê lead_magnets.external_url';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE '✅ anon lê só as colunas públicas de lead_magnets';
END $$;
RESET ROLE;

\echo 'TEST: csat_surveys/document_signatures sem policy por token para anon/public'
DO $$
DECLARE bad TEXT;
BEGIN
  SELECT string_agg(format('%s.%s', tablename, policyname), ', ') INTO bad
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('csat_surveys', 'document_signatures')
     AND roles && ARRAY['anon', 'public']::name[]
     AND coalesce(qual, '') || coalesce(with_check, '') NOT LIKE '%auth.uid()%';
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION '❌ policies públicas sem auth.uid(): %', bad;
  END IF;
  RAISE NOTICE '✅ csat_surveys/document_signatures só com policies do dono';
END $$;

\echo 'TEST: RPCs públicas de contador/tracking executam como anon'
SET ROLE anon;
DO $$
DECLARE
  calls TEXT[] := ARRAY[
    $q$SELECT public.increment_form_view('rls-slug-inexistente')$q$,
    $q$SELECT public.increment_magnet_view('rls-slug-inexistente')$q$,
    $q$SELECT public.increment_landing_page_view(gen_random_uuid())$q$,
    $q$SELECT public.record_buyer_view('rls-token-inexistente', NULL)$q$,
    $q$SELECT public.get_public_csat_survey(gen_random_uuid())$q$
  ];
  c TEXT;
BEGIN
  FOREACH c IN ARRAY calls LOOP
    BEGIN
      EXECUTE c;
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE EXCEPTION '❌ anon sem privilégio em: % (%)', c, SQLERRM;
      WHEN raise_exception OR no_data_found OR invalid_parameter_value OR not_null_violation THEN NULL;
    END;
  END LOOP;
  RAISE NOTICE '✅ RPCs públicas de contador/tracking executam como anon sem permission denied';
END $$;
RESET ROLE;
