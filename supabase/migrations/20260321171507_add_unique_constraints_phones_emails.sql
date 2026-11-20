-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321171507
-- nome:   add_unique_constraints_phones_emails

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
