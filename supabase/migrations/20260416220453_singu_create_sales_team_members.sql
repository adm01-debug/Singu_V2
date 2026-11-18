-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416220453
-- nome:   singu_create_sales_team_members

-- ============================================================================
-- SINGU — TABELA 1/9: sales_team_members
-- Spec: memory features/lead-routing-portfolio-rotation
-- "Vendedores com role (sdr/closer/manager), peso (1-10), caps diário/total, férias"
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sales_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  member_user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('sdr','closer','manager','admin')),
  weight integer NOT NULL DEFAULT 5 CHECK (weight BETWEEN 1 AND 10),
  daily_cap integer DEFAULT 20,
  total_cap integer,
  is_active boolean DEFAULT true,
  is_on_vacation boolean DEFAULT false,
  vacation_start date,
  vacation_end date,
  last_assigned_at timestamp with time zone,
  assignments_today integer DEFAULT 0,
  assignments_total integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_member_per_user UNIQUE (user_id, member_user_id)
);

COMMENT ON TABLE public.sales_team_members IS 'SINGU: Membros do time de vendas com role (sdr/closer/manager), peso para round-robin ponderado (1-10), caps diário/total e controle de férias. Usado pelo módulo Lead Routing & Portfolio Rotation.';

CREATE INDEX IF NOT EXISTS idx_sales_team_members_user_active ON public.sales_team_members (user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sales_team_members_role ON public.sales_team_members (role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sales_team_members_last_assigned ON public.sales_team_members (last_assigned_at ASC NULLS FIRST) WHERE is_active = true AND is_on_vacation = false;

ALTER TABLE public.sales_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own" ON public.sales_team_members FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own" ON public.sales_team_members FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own" ON public.sales_team_members FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own" ON public.sales_team_members FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "service_role_full" ON public.sales_team_members FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger updated_at (reutiliza função genérica se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') THEN
    EXECUTE 'CREATE TRIGGER update_sales_team_members_updated_at BEFORE UPDATE ON public.sales_team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

UPDATE singu_migration._checklist 
SET status='done', completed_at=now(), notes=notes||' [applied via MCP 2026-04-16]'
WHERE step_number=25;
