
CREATE OR REPLACE FUNCTION public.sequence_pause_on_interaction_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN ('whatsapp_received', 'email_received', 'sms_received', 'call_received') 
     OR (NEW.initiated_by = 'contact' AND NEW.type IN ('whatsapp', 'email', 'sms', 'call')) THEN
    UPDATE public.sequence_enrollments
    SET 
      replied_at = COALESCE(replied_at, NEW.created_at),
      status = CASE 
        WHEN status = 'active' AND EXISTS(
          SELECT 1 FROM public.sequences s 
          WHERE s.id = sequence_enrollments.sequence_id AND s.pause_on_reply = true
        ) THEN 'replied'
        ELSE status
      END
    WHERE contact_id = NEW.contact_id
      AND user_id = NEW.user_id
      AND status = 'active'
      AND replied_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sequence_pause_on_reply ON public.interactions;
CREATE TRIGGER trg_sequence_pause_on_reply
AFTER INSERT ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.sequence_pause_on_interaction_reply();

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_contact_active 
ON public.sequence_enrollments(contact_id, user_id, status) 
WHERE status = 'active';
