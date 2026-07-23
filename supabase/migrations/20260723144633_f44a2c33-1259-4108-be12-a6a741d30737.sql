
-- ============================================================================
-- Rodada 45/10 — Global Least Privilege for `anon`
-- (defaults na raiz supabase_admin/postgres serão tratados via runbook: escapo do migrator)
-- ============================================================================

-- 1) Sweep: revogar todos os privilégios de anon em TODAS as tabelas de public.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', r.relname);
  END LOOP;
END $$;

-- 2) Re-grants cirúrgicos alinhados às policies de RLS que incluem `anon`.

GRANT SELECT, UPDATE ON public.csat_surveys TO anon;

GRANT SELECT, INSERT ON public.deal_room_activities TO anon;

GRANT SELECT ON public.deal_room_comments    TO anon;
GRANT SELECT ON public.deal_room_documents   TO anon;
GRANT SELECT ON public.deal_room_milestones  TO anon;
GRANT SELECT ON public.deal_room_stakeholders TO anon;

-- deal_rooms: SELECT + UPDATE column-level (contadores de view, Rodada 43).
GRANT SELECT ON public.deal_rooms TO anon;
GRANT UPDATE (buyer_view_count, last_buyer_view_at) ON public.deal_rooms TO anon;

GRANT SELECT ON public.document_signatures TO anon;

-- forms: SELECT + UPDATE column-level em view_count quando existir.
GRANT SELECT ON public.forms TO anon;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='forms' AND column_name='view_count'
  ) THEN
    EXECUTE 'GRANT UPDATE (view_count) ON public.forms TO anon';
  END IF;
END $$;

-- landing_pages: SELECT + UPDATE column-level em view_count quando existir.
GRANT SELECT ON public.landing_pages TO anon;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='landing_pages' AND column_name='view_count'
  ) THEN
    EXECUTE 'GRANT UPDATE (view_count) ON public.landing_pages TO anon';
  END IF;
END $$;

-- landing_page_submissions: INSERT-only (captura de leads).
GRANT INSERT ON public.landing_page_submissions TO anon;

-- lead_magnets: SELECT + UPDATE column-level em view/download counters.
GRANT SELECT ON public.lead_magnets TO anon;
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(column_name, ', ') INTO cols
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='lead_magnets'
     AND column_name IN ('view_count','download_count');
  IF cols IS NOT NULL AND length(cols) > 0 THEN
    EXECUTE format('GRANT UPDATE (%s) ON public.lead_magnets TO anon', cols);
  END IF;
END $$;

-- 3) Sequências: revogar tudo de anon (nenhuma rota pública usa nextval direto).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname='public' AND c.relkind='S'
  LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM anon', r.relname);
  END LOOP;
END $$;
