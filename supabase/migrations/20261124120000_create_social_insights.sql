-- Cria public.social_insights com o formato consumido por src/hooks/useSocialInsights.ts
-- (usado por SocialIntelligencePanel e SocialMatchDetails).
-- A definição original em 20260720000023_create_phantom_tables.sql não previa
-- source_url, indicator_score nem sentiment, colunas usadas pela UI.
CREATE TABLE IF NOT EXISTS public.social_insights (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        text NOT NULL,
  insight_type    text,
  content         text NOT NULL DEFAULT '',
  source_url      text,
  metadata        jsonb,
  indicator_score numeric NOT NULL DEFAULT 0,
  sentiment       text NOT NULL DEFAULT 'neutral',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_insights ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.social_insights ADD COLUMN IF NOT EXISTS indicator_score numeric NOT NULL DEFAULT 0;
ALTER TABLE public.social_insights ADD COLUMN IF NOT EXISTS sentiment text NOT NULL DEFAULT 'neutral';

ALTER TABLE public.social_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_insights_select_own" ON public.social_insights;
CREATE POLICY "social_insights_select_own"
  ON public.social_insights FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "social_insights_insert_own" ON public.social_insights;
CREATE POLICY "social_insights_insert_own"
  ON public.social_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "social_insights_update_own" ON public.social_insights;
CREATE POLICY "social_insights_update_own"
  ON public.social_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "social_insights_delete_own" ON public.social_insights;
CREATE POLICY "social_insights_delete_own"
  ON public.social_insights FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS social_insights_contact_id_idx
  ON public.social_insights (contact_id);
CREATE INDEX IF NOT EXISTS social_insights_user_id_idx
  ON public.social_insights (user_id);
CREATE INDEX IF NOT EXISTS social_insights_contact_id_platform_idx
  ON public.social_insights (contact_id, platform);
CREATE INDEX IF NOT EXISTS social_insights_created_at_idx
  ON public.social_insights (created_at DESC);