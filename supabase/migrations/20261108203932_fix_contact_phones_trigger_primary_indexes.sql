-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20261108203932
-- nome:   fix_contact_phones_trigger_primary_indexes

DROP TRIGGER IF EXISTS set_updated_at ON public.contact_phones;

CREATE INDEX IF NOT EXISTS idx_contact_phones_primary
  ON public.contact_phones (contact_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_contact_emails_primary
  ON public.contact_emails (contact_id)
  WHERE is_primary = true;
