-- Dropar UNIQUE indexes antigos que duplicam os novos
-- contact_phones: idx_contact_phones_unique duplica contact_phones_contact_id_numero_norm_unique
DROP INDEX IF EXISTS public.idx_contact_phones_unique;

-- contact_emails: idx_contact_emails_unique duplica contact_emails_contact_id_email_ci_unique
DROP INDEX IF EXISTS public.idx_contact_emails_unique;
