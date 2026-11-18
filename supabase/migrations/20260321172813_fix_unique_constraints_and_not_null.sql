-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321172813
-- nome:   fix_unique_constraints_and_not_null

-- ============================================================
-- CORREÇÃO #1: UNIQUE no campo normalizado (não raw)
-- ============================================================

-- company_phones: (company_id, numero) → (company_id, numero_normalizado)
ALTER TABLE public.company_phones
  DROP CONSTRAINT company_phones_company_id_numero_unique;
ALTER TABLE public.company_phones
  ADD CONSTRAINT company_phones_company_id_numero_norm_unique
  UNIQUE (company_id, numero_normalizado);

-- contact_phones: (contact_id, numero) → (contact_id, numero_normalizado)
ALTER TABLE public.contact_phones
  DROP CONSTRAINT contact_phones_contact_id_numero_unique;
ALTER TABLE public.contact_phones
  ADD CONSTRAINT contact_phones_contact_id_numero_norm_unique
  UNIQUE (contact_id, numero_normalizado);

-- ============================================================
-- CORREÇÃO #6 (WARNING #4): UNIQUE case-insensitive emails
-- ============================================================

-- company_emails: functional index LOWER(email)
ALTER TABLE public.company_emails
  DROP CONSTRAINT company_emails_company_id_email_unique;
CREATE UNIQUE INDEX company_emails_company_id_email_ci_unique
  ON public.company_emails (company_id, LOWER(email));

-- contact_emails: functional index LOWER(email)
ALTER TABLE public.contact_emails
  DROP CONSTRAINT contact_emails_contact_id_email_unique;
CREATE UNIQUE INDEX contact_emails_contact_id_email_ci_unique
  ON public.contact_emails (contact_id, LOWER(email));

-- ============================================================
-- WARNING #1: contact_phones.numero NOT NULL
-- ============================================================
ALTER TABLE public.contact_phones
  ALTER COLUMN numero SET NOT NULL;
