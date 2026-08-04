-- ============================================================
-- Migration: RLS corrections — add missing DELETE policies +
--            remove duplicate/redundant policy sets
-- ============================================================

-- ── 1. profiles: add DELETE so users can erase their own profile (GDPR) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can delete their own profile'
  ) THEN
    CREATE POLICY "Users can delete their own profile"
      ON public.profiles FOR DELETE TO authenticated
      USING (id = auth.uid());
  END IF;
END$$;

-- ── 2. brain_dominance_analysis: add DELETE (sensitive psych data) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'brain_dominance_analysis' AND policyname = 'Users can delete brain dominance analysis'
  ) THEN
    CREATE POLICY "Users can delete brain dominance analysis"
      ON public.brain_dominance_analysis FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.contacts c
          WHERE c.id = brain_dominance_analysis.contact_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- ── 3. neuro_pnl_sessions: add DELETE (sensitive NLP session data) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'neuro_pnl_sessions' AND policyname = 'Users can delete neuro pnl sessions'
  ) THEN
    CREATE POLICY "Users can delete neuro pnl sessions"
      ON public.neuro_pnl_sessions FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.contacts c
          WHERE c.id = neuro_pnl_sessions.contact_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- ── 4. whatsapp_messages_index: add DELETE ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_messages_index' AND policyname = 'Users can delete whatsapp messages index'
  ) THEN
    CREATE POLICY "Users can delete whatsapp messages index"
      ON public.whatsapp_messages_index FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.contacts c
          WHERE c.id = whatsapp_messages_index.contact_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- ── 5. contacts: drop redundant FOR ALL policy (4 scoped CRUD policies already exist) ──
-- The FOR ALL "Users can access their own contacts" was added by migration 20260509150114
-- without first checking if the 4 granular policies already existed. It is redundant and
-- doubles evaluation cost for every query on contacts.
DROP POLICY IF EXISTS "Users can access their own contacts" ON public.contacts;

-- ── 6. deals: drop second duplicate policy set added by 20260512184042 without
--    checking for the already-present set from 20260317213221 ──
DROP POLICY IF EXISTS "Users can view their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can insert their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON public.deals;
