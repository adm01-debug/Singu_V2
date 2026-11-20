-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408195848
-- nome:   zapp_history_01_extensions_and_schema

-- ============================================================================
-- zapp_history MIGRATION 01 — Schema + extensions + helpers (RBAC simples)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE SCHEMA IF NOT EXISTS zapp_history;
COMMENT ON SCHEMA zapp_history IS
  'Histórico WhatsApp vindo da Evolution API: messages, mídia, áudio transcrito, links, sumários diários, embeddings. Alimenta SINGU com input bruto.';

CREATE OR REPLACE FUNCTION zapp_history.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$fn$;

-- Tabela de grants explícitos de admin (simples e auditável)
CREATE TABLE IF NOT EXISTS zapp_history.admin_grants (
  user_id UUID PRIMARY KEY,
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);
COMMENT ON TABLE zapp_history.admin_grants IS
  'Usuários com acesso total ao histórico (override do ownership). Popular manualmente pelo service_role.';

-- Helper de acesso: owner do contato OU admin_grant explícito
CREATE OR REPLACE FUNCTION zapp_history.user_can_access_contact(
  p_contact_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, zapp_history, pg_temp
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = p_contact_id
      AND c.deleted_at IS NULL
      AND (
        c.user_id = p_user_id
        OR EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = p_user_id)
      )
  );
$fn$;

COMMENT ON FUNCTION zapp_history.user_can_access_contact IS
  'Regra de acesso: owner do contato (contacts.user_id) OU admin_grants. Service_role bypassa RLS.';
