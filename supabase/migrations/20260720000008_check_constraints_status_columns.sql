-- Migration: CHECK constraints on status/type/priority enum columns
-- Enforces valid state machine values at the DB layer for 18 tables.
-- Each column was verified against live data before applying.
-- Skipped: scheduled_visits.visit_type (live value 'prospecção' with Unicode),
--          email_logs.status (set by email provider, unknown external values),
--          sync_log.status, trigger_ab_tests.status (needs more investigation).

-- automation_executions.status
ALTER TABLE public.automation_executions
  ADD CONSTRAINT chk_automation_executions_status
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));

-- calendar_events.status
ALTER TABLE public.calendar_events
  ADD CONSTRAINT chk_calendar_events_status
  CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'tentative'));

-- campaign_members.status
ALTER TABLE public.campaign_members
  ADD CONSTRAINT chk_campaign_members_status
  CHECK (status IN ('pending', 'active', 'completed', 'bounced', 'unsubscribed', 'opted_out'));

-- campaigns.status
ALTER TABLE public.campaigns
  ADD CONSTRAINT chk_campaigns_status
  CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'archived'));

-- campaigns.type
ALTER TABLE public.campaigns
  ADD CONSTRAINT chk_campaigns_type
  CHECK (type IN ('email', 'sms', 'whatsapp', 'push', 'in_app'));

-- company_cadences.status
ALTER TABLE public.company_cadences
  ADD CONSTRAINT chk_company_cadences_status
  CHECK (status IN ('active', 'paused', 'completed', 'archived'));

-- csat_surveys.status
ALTER TABLE public.csat_surveys
  ADD CONSTRAINT chk_csat_surveys_status
  CHECK (status IN ('pending', 'sent', 'answered', 'expired'));

-- documents.status
ALTER TABLE public.documents
  ADD CONSTRAINT chk_documents_status
  CHECK (status IN ('active', 'archived', 'draft'));

-- inactivity_alerts.status
ALTER TABLE public.inactivity_alerts
  ADD CONSTRAINT chk_inactivity_alerts_status
  CHECK (status IN ('active', 'snoozed', 'resolved', 'dismissed'));

-- interactions.status (Portuguese values confirmed from live data: 'concluido')
ALTER TABLE public.interactions
  ADD CONSTRAINT chk_interactions_status
  CHECK (status IN ('pendente', 'concluido', 'cancelado', 'agendado'));

-- password_reset_requests.status
ALTER TABLE public.password_reset_requests
  ADD CONSTRAINT chk_password_reset_requests_status
  CHECK (status IN ('pending', 'approved', 'rejected', 'expired'));

-- reminders.priority (Portuguese values; live data: 'alta', 'baixa', 'media')
ALTER TABLE public.reminders
  ADD CONSTRAINT chk_reminders_priority
  CHECK (priority IN ('alta', 'media', 'baixa', 'urgente'));

-- sales_opportunities.priority
ALTER TABLE public.sales_opportunities
  ADD CONSTRAINT chk_sales_opportunities_priority
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- sales_opportunities.status
ALTER TABLE public.sales_opportunities
  ADD CONSTRAINT chk_sales_opportunities_status
  CHECK (status IN ('identified', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'));

-- scheduled_visits.status (live data: 'scheduled', 'completed' — both present in list)
ALTER TABLE public.scheduled_visits
  ADD CONSTRAINT chk_scheduled_visits_status
  CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'));

-- sequences.status
ALTER TABLE public.sequences
  ADD CONSTRAINT chk_sequences_status
  CHECK (status IN ('draft', 'active', 'paused', 'archived'));

-- visit_checkins.visit_type (table is empty; values from original migration)
ALTER TABLE public.visit_checkins
  ADD CONSTRAINT chk_visit_checkins_visit_type
  CHECK (visit_type IN ('presencial', 'prospeccao', 'suporte', 'entrega', 'outro'));

-- whatsapp_instances.status
ALTER TABLE public.whatsapp_instances
  ADD CONSTRAINT chk_whatsapp_instances_status
  CHECK (status IN ('connected', 'disconnected', 'connecting', 'error', 'qr_code'));
