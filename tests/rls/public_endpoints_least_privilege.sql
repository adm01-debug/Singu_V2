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
