DROP TRIGGER IF EXISTS set_updated_at ON public.contact_phones;

CREATE INDEX IF NOT EXISTS idx_contact_phones_primary
  ON public.contact_phones (contact_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_contact_emails_primary
  ON public.contact_emails (contact_id)
  WHERE is_primary = true;
