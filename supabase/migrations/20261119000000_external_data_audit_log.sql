-- ============================================================================
-- Singu_V2 ? Auditoria de escrita do external-data (resgate de trabalho de agente)
-- Portado de adm01-debug/Singu (arquivado) ? branch security/hardening-2026-04-09,
-- migration original 20260409_security_hardening.sql (cria external_data_audit_log).
-- Adaptado ao schema do V2: gate admin via public.has_role(auth.uid(),'admin'::app_role)
-- (user_roles) em vez da coluna profiles.is_admin do agente original.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.external_data_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operation   text NOT NULL CHECK (operation IN ('select','insert','update','delete','distinct','schema','list_tables')),
  table_name  text NOT NULL,
  payload     jsonb,
  outcome     text NOT NULL CHECK (outcome IN ('success','denied','error')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_data_audit_user
  ON public.external_data_audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_data_audit_outcome
  ON public.external_data_audit_log (outcome, created_at DESC)
  WHERE outcome IN ('denied','error');

ALTER TABLE public.external_data_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins leem o audit log (padrao do V2: user_roles + has_role).
DROP POLICY IF EXISTS "admin_only_select_external_data_audit" ON public.external_data_audit_log;
CREATE POLICY "admin_only_select_external_data_audit"
  ON public.external_data_audit_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- Notas do resgate (branch security/hardening-2026-04-09, repo Singu arquivado):
--  * O original tambem adicionava is_admin em profiles e rodava queries de
--    diagnostico (tabelas sem RLS, policies ausentes, extensions em public).
--    No V2 o papel admin ja e resolvido por user_roles + has_role (mais
--    robusto); as queries de diagnostico eram one-off e nao persistem schema.
--  * Escrita do log: feita pela edge function external-data com service_role
--    (bypassa RLS); a policy acima so restringe leitura a admins.
-- ============================================================================
