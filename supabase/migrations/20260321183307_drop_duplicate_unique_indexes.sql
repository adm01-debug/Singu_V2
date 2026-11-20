-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321183307
-- nome:   drop_duplicate_unique_indexes

-- Dropar UNIQUE indexes antigos que duplicam os novos
-- contact_phones: idx_contact_phones_unique duplica contact_phones_contact_id_numero_norm_unique
DROP INDEX IF EXISTS public.idx_contact_phones_unique;

-- contact_emails: idx_contact_emails_unique duplica contact_emails_contact_id_email_ci_unique
DROP INDEX IF EXISTS public.idx_contact_emails_unique;
