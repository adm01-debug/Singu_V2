-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416220507
-- nome:   singu_create_lead_routing_rules

-- ============================================================================
-- SINGU — TABELA 2/9: lead_routing_rules  
-- "Regras de distribuição com tipo, prioridade, pool, role_filter"
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lead_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  rule_type text NOT NULL CHECK (rule_type IN ('round_robin','weighted','territory','industry','source','custom')),
  priority integer NOT NULL DEFAULT 100,
  is_active boolean DEFAULT true,
  -- Filtros de quem recebe
  role_filter text[] DEFAULT '{sdr}'::text[],
  team_pool uuid[] DEFAULT '{}'::uuid[],
  -- Condições de match
  conditions jsonb DEFAULT '{}'::jsonb,
  -- Estatísticas
  match_count integer DEFAULT 0,
  assignment_count integer DEFAULT 0,
  last_matched_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_routing_rules IS 'SINGU: Regras configuráveis de roteamento de leads (round-robin, ponderado, por território/indústria/fonte). Prioridade define ordem de avaliação. role_filter e team_pool definem o universo elegível.';

CREATE INDEX IF NOT EXISTS idx_lead_routing_rules_user_active_priority ON public.lead_routing_rules (user_id, is_active, priority) WHERE is_active = true;

ALTER TABLE public.lead_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own" ON public.lead_routing_rules FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.lead_routing_rules FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own" ON public.lead_routing_rules FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own" ON public.lead_routing_rules FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.lead_routing_rules FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') THEN
    EXECUTE 'CREATE TRIGGER update_lead_routing_rules_updated_at BEFORE UPDATE ON public.lead_routing_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

UPDATE singu_migration._checklist 
SET status='done', completed_at=now(), notes=notes||' [applied 2026-04-16]'
WHERE step_number=21;
