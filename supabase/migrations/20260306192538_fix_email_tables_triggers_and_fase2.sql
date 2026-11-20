-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260306192538
-- nome:   fix_email_tables_triggers_and_fase2

-- ══════════════════════════════════════════════
-- ITEM 2 — contact_emails + company_emails
-- ══════════════════════════════════════════════

-- 1. Remover triggers fantasmas (normalize_email_trigger é legado — 
--    trg_normalizar_email já faz tudo que ele faz + mais)
DROP TRIGGER IF EXISTS trg_contact_emails_normalize ON contact_emails;
DROP TRIGGER IF EXISTS trg_company_emails_normalize ON company_emails;

-- 2. contact_emails — padronizar tipos de FASE 2
--    (atualmente: text/text/integer — alinhar com contact_phones: varchar/varchar/smallint)
ALTER TABLE contact_emails
  ALTER COLUMN fonte         TYPE VARCHAR(100),
  ALTER COLUMN contexto      TYPE VARCHAR(200),
  ALTER COLUMN confiabilidade TYPE SMALLINT;

-- 3. company_emails — adicionar FASE 2 + is_verified (simetria com contact_emails)
ALTER TABLE company_emails
  ADD COLUMN IF NOT EXISTS fonte          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contexto       VARCHAR(200),
  ADD COLUMN IF NOT EXISTS confiabilidade SMALLINT,
  ADD COLUMN IF NOT EXISTS is_verified    BOOLEAN DEFAULT false;
