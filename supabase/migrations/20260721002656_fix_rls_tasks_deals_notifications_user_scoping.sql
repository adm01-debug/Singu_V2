-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721002656
-- nome:   fix_rls_tasks_deals_notifications_user_scoping

-- CRITICAL: RLS policies for tasks, deals, notifications only checked
-- auth.uid() IS NOT NULL, allowing any authenticated user to access
-- all other users' data. Replace with proper user_id scoping.

-- ══════════════════════════════════════════════════════════════════
-- TASKS
-- ══════════════════════════════════════════════════════════════════
-- Drop the single overly-broad ALL policy
DROP POLICY IF EXISTS tasks_all ON public.tasks;

-- Scoped policies: user can only see/touch their own tasks
DROP POLICY IF EXISTS tasks_select ON public.tasks;
CREATE POLICY tasks_select ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS tasks_insert ON public.tasks;
CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS tasks_update ON public.tasks;
CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS tasks_delete ON public.tasks;
CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- DEALS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS deals_select_policy ON public.deals;
DROP POLICY IF EXISTS deals_insert_policy ON public.deals;
DROP POLICY IF EXISTS deals_update_policy ON public.deals;

DROP POLICY IF EXISTS deals_select ON public.deals;
CREATE POLICY deals_select ON public.deals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS deals_insert ON public.deals;
CREATE POLICY deals_insert ON public.deals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS deals_update ON public.deals;
CREATE POLICY deals_update ON public.deals
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS deals_delete ON public.deals;
CREATE POLICY deals_delete ON public.deals
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS notifications_select ON public.notifications;
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
DROP POLICY IF EXISTS notifications_update ON public.notifications;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
