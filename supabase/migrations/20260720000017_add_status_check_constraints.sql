-- Add CHECK constraints to status columns that were created without them.
-- Uses NOT VALID so existing rows are not scanned (no table lock).
-- VALIDATE CONSTRAINT runs after as a separate, non-blocking step.

-- ── document_signatures.status ─────────────────────────────────────────────
ALTER TABLE public.document_signatures
  ADD CONSTRAINT chk_document_signatures_status
    CHECK (status IN ('pending','viewed','signed','declined','expired'))
    NOT VALID;
ALTER TABLE public.document_signatures
  VALIDATE CONSTRAINT chk_document_signatures_status;

-- ── social_sync_queue.status ───────────────────────────────────────────────
ALTER TABLE public.social_sync_queue
  ADD CONSTRAINT chk_social_sync_queue_status
    CHECK (status IN ('pending','processing','completed','failed'))
    NOT VALID;
ALTER TABLE public.social_sync_queue
  VALIDATE CONSTRAINT chk_social_sync_queue_status;

-- ── whatsapp_messages.status ───────────────────────────────────────────────
ALTER TABLE public.whatsapp_messages
  ADD CONSTRAINT chk_whatsapp_messages_status
    CHECK (status IN ('pending','sent','delivered','read','played','failed'))
    NOT VALID;
ALTER TABLE public.whatsapp_messages
  VALIDATE CONSTRAINT chk_whatsapp_messages_status;

-- ── whatsapp_instances.status ──────────────────────────────────────────────
ALTER TABLE public.whatsapp_instances
  ADD CONSTRAINT chk_whatsapp_instances_status
    CHECK (status IN ('connected','disconnected','connecting'))
    NOT VALID;
ALTER TABLE public.whatsapp_instances
  VALIDATE CONSTRAINT chk_whatsapp_instances_status;

-- ── follow_up_approvals.status ─────────────────────────────────────────────
ALTER TABLE public.follow_up_approvals
  ADD CONSTRAINT chk_follow_up_approvals_status
    CHECK (status IN ('pending','approved','rejected','sent'))
    NOT VALID;
ALTER TABLE public.follow_up_approvals
  VALIDATE CONSTRAINT chk_follow_up_approvals_status;

-- ── crm_automation_logs.status ─────────────────────────────────────────────
ALTER TABLE public.crm_automation_logs
  ADD CONSTRAINT chk_crm_automation_logs_status
    CHECK (status IN ('pending','success','failed','error'))
    NOT VALID;
ALTER TABLE public.crm_automation_logs
  VALIDATE CONSTRAINT chk_crm_automation_logs_status;

-- ── crm_automation_reprocess_queue.status ──────────────────────────────────
ALTER TABLE public.crm_automation_reprocess_queue
  ADD CONSTRAINT chk_crm_automation_reprocess_queue_status
    CHECK (status IN ('pending','retrying','failed','success'))
    NOT VALID;
ALTER TABLE public.crm_automation_reprocess_queue
  VALIDATE CONSTRAINT chk_crm_automation_reprocess_queue_status;
