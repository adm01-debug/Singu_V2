-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416220539
-- nome:   singu_create_handoff_requests

-- ============================================================================
-- SINGU — TABELA 4/9: handoff_requests
-- "Fila SDR→Closer com qualificação BANT e SLA de aceite (4h)"
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.handoff_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  company_id uuid,
  from_user_id uuid NOT NULL,
  to_user_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired','cancelled')),
  -- Qualificação BANT
  bant_budget text,
  bant_authority text,
  bant_need text,
  bant_timing text,
  bant_score integer CHECK (bant_score BETWEEN 0 AND 100),
  -- Contexto do handoff
  qualification_notes text,
  next_steps text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  -- SLA
  sla_deadline timestamp with time zone NOT NULL DEFAULT (now() + interval '4 hours'),
  sla_breached boolean DEFAULT false,
  accepted_at timestamp with time zone,
  rejected_at timestamp with time zone,
  rejection_reason text,
  expired_at timestamp with time zone,
  assignment_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.handoff_requests IS 'SINGU: Fila de handoff SDR→Closer com qualificação BANT (Budget/Authority/Need/Timing), SLA de aceite de 4h (configurável) e tracking completo. Estados: pending → accepted/rejected/expired.';

ALTER TABLE public.handoff_requests
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS from_user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS to_user_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired','cancelled')),
  ADD COLUMN IF NOT EXISTS bant_budget text,
  ADD COLUMN IF NOT EXISTS bant_authority text,
  ADD COLUMN IF NOT EXISTS bant_need text,
  ADD COLUMN IF NOT EXISTS bant_timing text,
  ADD COLUMN IF NOT EXISTS bant_score integer CHECK (bant_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS qualification_notes text,
  ADD COLUMN IF NOT EXISTS next_steps text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  ADD COLUMN IF NOT EXISTS sla_deadline timestamp with time zone NOT NULL DEFAULT (now() + interval '4 hours'),
  ADD COLUMN IF NOT EXISTS sla_breached boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS expired_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS assignment_id uuid,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();


CREATE INDEX IF NOT EXISTS idx_handoff_requests_user_status ON public.handoff_requests (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handoff_requests_to_user_pending ON public.handoff_requests (to_user_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_handoff_requests_sla ON public.handoff_requests (sla_deadline) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_handoff_requests_contact ON public.handoff_requests (contact_id, created_at DESC);

ALTER TABLE public.handoff_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own" ON public.handoff_requests FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.handoff_requests FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own" ON public.handoff_requests FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own" ON public.handoff_requests FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.handoff_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_handoff_requests_updated_at ON public.handoff_requests';
    EXECUTE 'CREATE TRIGGER update_handoff_requests_updated_at BEFORE UPDATE ON public.handoff_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

UPDATE singu_migration._checklist 
SET status='done', completed_at=now(), notes=notes||' [applied 2026-04-16]'
WHERE step_number=27;
