-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321162735
-- nome:   add_fk_constraints_orphan_tables

-- FK: company_addresses → companies
ALTER TABLE public.company_addresses
  ADD CONSTRAINT company_addresses_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id)
  ON DELETE CASCADE;

-- FK: company_phones → companies
ALTER TABLE public.company_phones
  ADD CONSTRAINT company_phones_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id)
  ON DELETE CASCADE;

-- FK: company_emails → companies
ALTER TABLE public.company_emails
  ADD CONSTRAINT company_emails_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id)
  ON DELETE CASCADE;

-- FK: contact_emails → contacts
ALTER TABLE public.contact_emails
  ADD CONSTRAINT contact_emails_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id)
  ON DELETE CASCADE;

-- FK: contact_phones → contacts
ALTER TABLE public.contact_phones
  ADD CONSTRAINT contact_phones_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id)
  ON DELETE CASCADE;
