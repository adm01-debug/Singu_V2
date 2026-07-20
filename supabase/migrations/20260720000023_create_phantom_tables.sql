-- Create phantom tables referenced by edge functions but missing from migration history.
-- Covers: notifications, tasks, social_insights

-- ─────────────────────────────────────────────
-- 1. notifications
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  message     text NOT NULL DEFAULT '',
  type        text NOT NULL DEFAULT 'info',
  action_url  text,
  metadata    jsonb,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_id_read_idx
  ON public.notifications (user_id, read)
  WHERE read = false;

-- ─────────────────────────────────────────────
-- 2. tasks
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id  uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority    text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date    timestamptz,
  completed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_own"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_own"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete_own"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tasks_user_id_status_idx
  ON public.tasks (user_id, status);

CREATE INDEX IF NOT EXISTS tasks_user_id_contact_id_idx
  ON public.tasks (user_id, contact_id);

CREATE INDEX IF NOT EXISTS tasks_contact_id_idx
  ON public.tasks (contact_id);

-- ─────────────────────────────────────────────
-- 3. social_insights
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_insights (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform    text NOT NULL,
  content     text NOT NULL DEFAULT '',
  insight_type text,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_insights_select_own"
  ON public.social_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "social_insights_insert_own"
  ON public.social_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "social_insights_update_own"
  ON public.social_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "social_insights_delete_own"
  ON public.social_insights FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS social_insights_contact_id_idx
  ON public.social_insights (contact_id);

CREATE INDEX IF NOT EXISTS social_insights_user_id_idx
  ON public.social_insights (user_id);

CREATE INDEX IF NOT EXISTS social_insights_contact_id_platform_idx
  ON public.social_insights (contact_id, platform);
