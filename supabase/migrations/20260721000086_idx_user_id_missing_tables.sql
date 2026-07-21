-- Migration: idx_user_id_missing_tables (Wave 172)
-- PERFORMANCE FIX: 7 tables have RLS policies filtering on user_id but were
-- missed in Wave 168. Every authenticated REST API query against these tables
-- causes a sequential scan without a user_id index.
--
-- Tables confirmed to have user_id column (uuid) with no existing index:
--   activities, alerts, documents, meetings, proposals, quick_notes, user_goals

CREATE INDEX IF NOT EXISTS idx_activities_user_id
  ON public.activities (user_id);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id
  ON public.alerts (user_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id
  ON public.documents (user_id);

CREATE INDEX IF NOT EXISTS idx_meetings_user_id
  ON public.meetings (user_id);

CREATE INDEX IF NOT EXISTS idx_proposals_user_id
  ON public.proposals (user_id);

CREATE INDEX IF NOT EXISTS idx_quick_notes_user_id
  ON public.quick_notes (user_id);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id
  ON public.user_goals (user_id);

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  missing_count int;
BEGIN
  WITH target_tables AS (
    SELECT unnest(ARRAY[
      'activities','alerts','documents','meetings',
      'proposals','quick_notes','user_goals'
    ]) AS tablename
  ),
  indexed AS (
    SELECT DISTINCT t.relname AS tablename
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE a.attname = 'user_id'
  )
  SELECT COUNT(*) INTO missing_count
  FROM target_tables tt
  LEFT JOIN indexed i ON i.tablename = tt.tablename
  WHERE i.tablename IS NULL;

  IF missing_count = 0 THEN
    RAISE NOTICE '[Wave 172] All 7 remaining tables now have user_id indexes. RLS scan performance clean.';
  ELSE
    RAISE WARNING '[Wave 172] % tables still missing user_id index', missing_count;
  END IF;
END;
$$;
