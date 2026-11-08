-- UNIQUE: company_phones (company_id, numero)
ALTER TABLE public.company_phones
  ADD CONSTRAINT company_phones_company_id_numero_unique
  UNIQUE (company_id, numero);

-- UNIQUE: company_emails (company_id, email)
ALTER TABLE public.company_emails
  ADD CONSTRAINT company_emails_company_id_email_unique
  UNIQUE (company_id, email);

-- UNIQUE: contact_phones (contact_id, numero)
ALTER TABLE public.contact_phones
  ADD CONSTRAINT contact_phones_contact_id_numero_unique
  UNIQUE (contact_id, numero);

-- UNIQUE: contact_emails (contact_id, email)
ALTER TABLE public.contact_emails
  ADD CONSTRAINT contact_emails_contact_id_email_unique
  UNIQUE (contact_id, email);
