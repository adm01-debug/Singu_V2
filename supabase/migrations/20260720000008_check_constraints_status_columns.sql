-- Migration: CHECK constraints on status/type/priority enum columns
-- Enforces valid state machine values at the DB layer for 18 tables.
-- Each column was verified against live data before applying.
-- Skipped: scheduled_visits.visit_type (live value 'prospecção' with Unicode),
--          email_logs.status (set by email provider, unknown external values),
--          sync_log.status, trigger_ab_tests.status (needs more investigation).

DO $migration$
DECLARE
  constraint_definition record;
BEGIN
  FOR constraint_definition IN
    SELECT *
    FROM (VALUES
      ('automation_executions', 'status', 'chk_automation_executions_status', $$status IN ('pending', 'running', 'completed', 'failed', 'cancelled')$$),
      ('calendar_events', 'status', 'chk_calendar_events_status', $$status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'tentative')$$),
      ('campaign_members', 'status', 'chk_campaign_members_status', $$status IN ('pending', 'active', 'completed', 'bounced', 'unsubscribed', 'opted_out')$$),
      ('campaigns', 'status', 'chk_campaigns_status', $$status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'archived')$$),
      ('campaigns', 'type', 'chk_campaigns_type', $$type IN ('email', 'sms', 'whatsapp', 'push', 'in_app')$$),
      ('company_cadences', 'status', 'chk_company_cadences_status', $$status IN ('active', 'paused', 'completed', 'archived')$$),
      ('csat_surveys', 'status', 'chk_csat_surveys_status', $$status IN ('pending', 'sent', 'answered', 'expired')$$),
      ('documents', 'status', 'chk_documents_status', $$status IN ('active', 'archived', 'draft')$$),
      ('inactivity_alerts', 'status', 'chk_inactivity_alerts_status', $$status IN ('active', 'snoozed', 'resolved', 'dismissed')$$),
      ('interactions', 'status', 'chk_interactions_status', $$status IN ('pendente', 'concluido', 'cancelado', 'agendado')$$),
      ('password_reset_requests', 'status', 'chk_password_reset_requests_status', $$status IN ('pending', 'approved', 'rejected', 'expired')$$),
      ('reminders', 'priority', 'chk_reminders_priority', $$priority IN ('alta', 'media', 'baixa', 'urgente')$$),
      ('sales_opportunities', 'priority', 'chk_sales_opportunities_priority', $$priority IN ('low', 'medium', 'high', 'urgent')$$),
      ('sales_opportunities', 'status', 'chk_sales_opportunities_status', $$status IN ('identified', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold')$$),
      ('scheduled_visits', 'status', 'chk_scheduled_visits_status', $$status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled')$$),
      ('sequences', 'status', 'chk_sequences_status', $$status IN ('draft', 'active', 'paused', 'archived')$$),
      ('visit_checkins', 'visit_type', 'chk_visit_checkins_visit_type', $$visit_type IN ('presencial', 'prospeccao', 'suporte', 'entrega', 'outro')$$),
      ('whatsapp_instances', 'status', 'chk_whatsapp_instances_status', $$status IN ('connected', 'disconnected', 'connecting', 'error', 'qr_code')$$)
    ) AS constraints(table_name, column_name, constraint_name, expression)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', constraint_definition.table_name))
        AND attname = constraint_definition.column_name
        AND NOT attisdropped
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = to_regclass(format('public.%I', constraint_definition.table_name))
        AND conname = constraint_definition.constraint_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s)',
        constraint_definition.table_name,
        constraint_definition.constraint_name,
        constraint_definition.expression
      );
    END IF;
  END LOOP;
END;
$migration$;
