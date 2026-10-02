-- Performance-critical indexes identified during system audit (2026-07-19)
-- Each index targets a hot query path that appears repeatedly in edge functions.

-- sequence_processor cron: .eq('status','active').lte('next_action_at', now())
-- The existing idx_sequence_enrollments_contact_active covers (contact_id, user_id, status)
-- but the cron does a full-table scan for status='active' sorted by next_action_at.
-- This compound index lets Postgres do a single range scan for the cron job.
CREATE INDEX IF NOT EXISTS idx_seq_enroll_active_next_action
  ON public.sequence_enrollments (next_action_at)
  WHERE status = 'active';

-- sequence_events: cron checks for 'replied' events per enrollment
-- Query: .eq('enrollment_id', id).eq('event_type', 'replied').limit(1)
-- The existing idx_seq_events_enrollment is on (enrollment_id, created_at DESC).
-- Adding a partial index for the 'replied' event type makes the pause-on-reply
-- check significantly cheaper.
CREATE INDEX IF NOT EXISTS idx_seq_events_enrollment_replied
  ON public.sequence_events (enrollment_id)
  WHERE event_type = 'replied';

-- sequence_send_log: sequence_processor queries .eq('enrollment_id', id).eq('step_order', N)
-- The existing idx_seq_send_log_enrollment covers enrollment_id alone.
-- Adding step_order to the index key avoids a filter step.
CREATE INDEX IF NOT EXISTS idx_seq_send_log_enrollment_step
  ON public.sequence_send_log (enrollment_id, step_order);

-- interactions: the next-best-action function queries
-- .eq('contact_id', id).order('created_at', {ascending:false}).limit(10)
-- The existing idx_interactions_contact_id is on contact_id alone.
-- A covering index on (contact_id, created_at DESC) avoids an extra sort step.
CREATE INDEX IF NOT EXISTS idx_interactions_contact_created
  ON public.interactions (contact_id, created_at DESC);

-- contacts: search by relationship_stage is common in pipeline and NBA functions
CREATE INDEX IF NOT EXISTS idx_contacts_relationship_stage
  ON public.contacts (user_id, relationship_stage)
  WHERE relationship_stage IS NOT NULL;

-- neuro_behavioral_history: frequently queried per contact in AI functions
-- .eq('contact_id', id).order('created_at', {ascending:false}).limit(5)
CREATE INDEX IF NOT EXISTS idx_neuro_behavioral_contact_created
  ON public.neuro_behavioral_history (contact_id, created_at DESC);

-- contact_analytical_profiles: NBA function uses .maybeSingle() by contact_id
-- Should already have a unique constraint; ensure the index is present
CREATE INDEX IF NOT EXISTS idx_contact_analytical_profiles_contact
  ON public.contact_analytical_profiles (contact_id);

-- whatsapp_messages: NBA function queries
-- .eq('contact_id', id).order('timestamp', {ascending:false}).limit(5)
-- The existing idx_whatsapp_messages_contact_id covers contact_id alone.
-- Compound with timestamp avoids an extra sort step.
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_timestamp
  ON public.whatsapp_messages (contact_id, timestamp DESC);

-- contact_next_actions: looked up by contact_id for NBA display
CREATE INDEX IF NOT EXISTS idx_contact_next_actions_contact
  ON public.contact_next_actions (contact_id);

-- behavioral_profile_regen_queue: process-behavioral-regen-queue cron queries
-- .lt('attempts', 5).lte('next_run_at', now()).order('next_run_at')
CREATE INDEX IF NOT EXISTS idx_bpr_queue_next_run
  ON public.behavioral_profile_regen_queue (next_run_at)
  WHERE attempts < 5;

-- activities: frequently queried ordered by created_at for audit logs
-- The existing idx_activities_user_id covers user_id alone.
CREATE INDEX IF NOT EXISTS idx_activities_user_created
  ON public.activities (user_id, created_at DESC);
