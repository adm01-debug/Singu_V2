-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416220523
-- nome:   singu_create_lead_assignments

-- ============================================================================
-- SINGU — TABELA 3/9: lead_assignments
-- "Histórico de atribuições com SLA tracking e status"
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lead_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid,
  company_id uuid,
  assigned_to uuid NOT NULL,
  assigned_by uuid,
  assigned_by_rule_id uuid,
  previous_owner uuid,
  assignment_type text NOT NULL DEFAULT 'automatic' CHECK (assignment_type IN ('automatic','manual','handoff','redistribution','reassignment')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','accepted','rejected','expired','completed','reassigned')),
  sla_deadline timestamp with time zone,
  sla_status text DEFAULT 'within' CHECK (sla_status IN ('within','warning','breached','na')),
  accepted_at timestamp with time zone,
  rejected_at timestamp with time zone,
  completed_at timestamp with time zone,
  rejection_reason text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_assignments IS 'SINGU: Histórico completo de atribuições de leads. Cada atribuição (automática via regra, manual, ou handoff SDR→Closer) gera um registro com SLA tracking, status e motivo de rejeição se aplicável. Append-only via convenção.';

CREATE INDEX IF NOT EXISTS idx_lead_assignments_user_contact ON public.lead_assignments (user_id, contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_to_active ON public.lead_assignments (assigned_to, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_lead_assignments_sla ON public.lead_assignments (sla_deadline) WHERE status = 'active' AND sla_status != 'na';
CREATE INDEX IF NOT EXISTS idx_lead_assignments_rule ON public.lead_assignments (assigned_by_rule_id) WHERE assigned_by_rule_id IS NOT NULL;

ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own" ON public.lead_assignments FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.lead_assignments FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own" ON public.lead_assignments FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own" ON public.lead_assignments FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.lead_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') THEN
    EXECUTE 'CREATE TRIGGER update_lead_assignments_updated_at BEFORE UPDATE ON public.lead_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

UPDATE singu_migration._checklist 
SET status='done', completed_at=now(), notes=notes||' [applied 2026-04-16]'
WHERE step_number=20;
