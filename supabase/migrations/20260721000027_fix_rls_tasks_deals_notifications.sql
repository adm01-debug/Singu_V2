-- SECURITY FIX: RLS policies on tasks, deals, notifications were scoped only to
-- auth.uid() IS NOT NULL, which allowed any authenticated user to read/write/delete
-- every other user's records. Replaced with auth.uid() = user_id policies.

-- ══════════════════════════════════════════════════════════════════
-- TASKS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS tasks_all ON public.tasks;

CREATE POLICY tasks_select ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- DEALS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS deals_select_policy ON public.deals;
DROP POLICY IF EXISTS deals_insert_policy ON public.deals;
DROP POLICY IF EXISTS deals_update_policy ON public.deals;

CREATE POLICY deals_select ON public.deals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY deals_insert ON public.deals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY deals_update ON public.deals
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY deals_delete ON public.deals
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS notifications_select ON public.notifications;
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
DROP POLICY IF EXISTS notifications_update ON public.notifications;

CREATE POLICY notifications_select ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_insert ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
