-- SECURITY FIX: Replace auth.uid() IS NOT NULL policies with auth.uid() = user_id
-- on all tables holding user-private operational data.
-- Affected: contact_notes, custom_field_values, custom_fields, documents, meetings,
--           proposals, purchase_history, quick_notes, reminders, user_badges,
--           user_goals, whatsapp_instances, whatsapp_messages, automations.

-- ══════════════════════════════════════════════════════════════════
-- CONTACT NOTES
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can delete own notes" ON public.contact_notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.contact_notes;
DROP POLICY IF EXISTS "Users can read own notes" ON public.contact_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.contact_notes;

CREATE POLICY contact_notes_select ON public.contact_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY contact_notes_insert ON public.contact_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY contact_notes_update ON public.contact_notes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY contact_notes_delete ON public.contact_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- CUSTOM FIELDS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS custom_fields_all ON public.custom_fields;

CREATE POLICY custom_fields_select ON public.custom_fields
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY custom_fields_insert ON public.custom_fields
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY custom_fields_update ON public.custom_fields
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY custom_fields_delete ON public.custom_fields
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- CUSTOM FIELD VALUES
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS custom_field_values_all ON public.custom_field_values;

CREATE POLICY custom_field_values_select ON public.custom_field_values
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY custom_field_values_insert ON public.custom_field_values
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY custom_field_values_update ON public.custom_field_values
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY custom_field_values_delete ON public.custom_field_values
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- DOCUMENTS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS documents_all ON public.documents;

CREATE POLICY documents_select ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY documents_insert ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY documents_update ON public.documents
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY documents_delete ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- MEETINGS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS meetings_all ON public.meetings;

CREATE POLICY meetings_select ON public.meetings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY meetings_insert ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY meetings_update ON public.meetings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY meetings_delete ON public.meetings
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- PROPOSALS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS proposals_select_policy ON public.proposals;
DROP POLICY IF EXISTS proposals_insert_policy ON public.proposals;
DROP POLICY IF EXISTS proposals_update_policy ON public.proposals;

CREATE POLICY proposals_select ON public.proposals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY proposals_insert ON public.proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY proposals_update ON public.proposals
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY proposals_delete ON public.proposals
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- PURCHASE HISTORY
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS purchase_history_all ON public.purchase_history;

CREATE POLICY purchase_history_select ON public.purchase_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY purchase_history_insert ON public.purchase_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY purchase_history_update ON public.purchase_history
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY purchase_history_delete ON public.purchase_history
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- QUICK NOTES
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS quick_notes_all ON public.quick_notes;

CREATE POLICY quick_notes_select ON public.quick_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY quick_notes_insert ON public.quick_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY quick_notes_update ON public.quick_notes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY quick_notes_delete ON public.quick_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- REMINDERS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS reminders_all ON public.reminders;

CREATE POLICY reminders_select ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY reminders_insert ON public.reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY reminders_update ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY reminders_delete ON public.reminders
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- USER BADGES
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS user_badges_all ON public.user_badges;

CREATE POLICY user_badges_select ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_badges_insert ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_badges_update ON public.user_badges
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_badges_delete ON public.user_badges
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- USER GOALS
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS user_goals_all ON public.user_goals;

CREATE POLICY user_goals_select ON public.user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_goals_insert ON public.user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_goals_update ON public.user_goals
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_goals_delete ON public.user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- WHATSAPP INSTANCES  (service_role_full policy preserved)
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS whatsapp_instances_all ON public.whatsapp_instances;

CREATE POLICY whatsapp_instances_select ON public.whatsapp_instances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY whatsapp_instances_insert ON public.whatsapp_instances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY whatsapp_instances_update ON public.whatsapp_instances
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY whatsapp_instances_delete ON public.whatsapp_instances
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- WHATSAPP MESSAGES  (service_role_full policy preserved)
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS whatsapp_messages_all ON public.whatsapp_messages;

CREATE POLICY whatsapp_messages_select ON public.whatsapp_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY whatsapp_messages_insert ON public.whatsapp_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY whatsapp_messages_update ON public.whatsapp_messages
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY whatsapp_messages_delete ON public.whatsapp_messages
  FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- AUTOMATIONS  (scoped via created_by, not user_id)
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS automations_all ON public.automations;

CREATE POLICY automations_select ON public.automations
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY automations_insert ON public.automations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY automations_update ON public.automations
  FOR UPDATE USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY automations_delete ON public.automations
  FOR DELETE USING (auth.uid() = created_by);
