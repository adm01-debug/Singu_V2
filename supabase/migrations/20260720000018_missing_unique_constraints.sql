-- Add UNIQUE constraints required by upsert operations that use ON CONFLICT.
-- Without these, upsert ON CONFLICT clauses silently do nothing or error.

-- social_behavior_analysis: upserted by social-behavior-analyzer and
-- generate-behavioral-profile functions using onConflict: 'contact_id'.
ALTER TABLE public.social_behavior_analysis
  ADD CONSTRAINT uq_social_behavior_analysis_contact_id
    UNIQUE (contact_id);

-- whatsapp_messages: upserted by evolution-webhook using
-- onConflict: 'message_id' (Evolution API message deduplication).
ALTER TABLE public.whatsapp_messages
  ADD CONSTRAINT uq_whatsapp_messages_message_id
    UNIQUE (message_id);
