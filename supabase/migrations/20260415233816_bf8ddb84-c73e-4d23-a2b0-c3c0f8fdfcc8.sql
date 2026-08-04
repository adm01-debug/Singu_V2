
-- =============================================
-- MÓDULO: RODÍZIO DE CARTEIRA SDR/CLOSER
-- =============================================

-- 1. sales_team_members
CREATE TABLE public.sales_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'sdr' CHECK (role IN ('sdr', 'closer', 'manager')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  weight INTEGER NOT NULL DEFAULT 5 CHECK (weight BETWEEN 1 AND 10),
  max_leads_day INTEGER NOT NULL DEFAULT 10,
  max_leads_total INTEGER NOT NULL DEFAULT 50,
  current_lead_count INTEGER NOT NULL DEFAULT 0,
  leads_today INTEGER NOT NULL DEFAULT 0,
  leads_today_reset_at DATE DEFAULT CURRENT_DATE,
  last_assigned_at TIMESTAMPTZ,
  territories TEXT[] DEFAULT '{}',
  specializations TEXT[] DEFAULT '{}',
  vacation_start DATE,
  vacation_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own team members"
  ON public.sales_team_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all team members"
  ON public.sales_team_members FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own team members"
  ON public.sales_team_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own team members"
  ON public.sales_team_members FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own team members"
  ON public.sales_team_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sales_team_role ON public.sales_team_members(role);
CREATE INDEX IF NOT EXISTS idx_sales_team_active ON public.sales_team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_team_user ON public.sales_team_members(user_id);

CREATE TRIGGER update_sales_team_members_updated_at
  BEFORE UPDATE ON public.sales_team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. lead_routing_rules
CREATE TABLE public.lead_routing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL DEFAULT 'round_robin' CHECK (rule_type IN ('round_robin', 'weighted', 'territory', 'specialization', 'load_balanced')),
  priority INTEGER NOT NULL DEFAULT 1,
  conditions JSONB NOT NULL DEFAULT '{}',
  team_pool UUID[] DEFAULT '{}',
  role_filter TEXT NOT NULL DEFAULT 'any' CHECK (role_filter IN ('sdr', 'closer', 'any')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  fallback_rule_id UUID REFERENCES public.lead_routing_rules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routing rules"
  ON public.lead_routing_rules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all routing rules"
  ON public.lead_routing_rules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own routing rules"
  ON public.lead_routing_rules FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routing rules"
  ON public.lead_routing_rules FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routing rules"
  ON public.lead_routing_rules FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON public.lead_routing_rules(priority);
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON public.lead_routing_rules(is_active);

CREATE TRIGGER update_lead_routing_rules_updated_at
  BEFORE UPDATE ON public.lead_routing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. lead_assignments
CREATE TABLE public.lead_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID,
  company_id UUID,
  assigned_to UUID NOT NULL REFERENCES public.sales_team_members(id) ON DELETE CASCADE,
  assigned_by UUID,
  assignment_type TEXT NOT NULL DEFAULT 'auto_round_robin' CHECK (assignment_type IN ('auto_round_robin', 'auto_weighted', 'auto_territory', 'manual', 'handoff', 'redistribution')),
  previous_owner UUID REFERENCES public.sales_team_members(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'reassigned')),
  routing_rule_id UUID REFERENCES public.lead_routing_rules(id) ON DELETE SET NULL,
  sla_deadline TIMESTAMPTZ,
  first_contact_at TIMESTAMPTZ,
  sla_met BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments"
  ON public.lead_assignments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all assignments"
  ON public.lead_assignments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own assignments"
  ON public.lead_assignments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments"
  ON public.lead_assignments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments"
  ON public.lead_assignments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assignments_contact ON public.lead_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON public.lead_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.lead_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON public.lead_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_created ON public.lead_assignments(created_at DESC);

CREATE TRIGGER update_lead_assignments_updated_at
  BEFORE UPDATE ON public.lead_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. handoff_requests
CREATE TABLE public.handoff_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID,
  company_id UUID,
  from_member_id UUID NOT NULL REFERENCES public.sales_team_members(id) ON DELETE CASCADE,
  to_member_id UUID REFERENCES public.sales_team_members(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  qualification_data JSONB NOT NULL DEFAULT '{}',
  handoff_reason TEXT,
  notes TEXT,
  rejection_reason TEXT,
  sla_hours INTEGER NOT NULL DEFAULT 4,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.handoff_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own handoff requests"
  ON public.handoff_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all handoff requests"
  ON public.handoff_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own handoff requests"
  ON public.handoff_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own handoff requests"
  ON public.handoff_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own handoff requests"
  ON public.handoff_requests FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_handoff_status ON public.handoff_requests(status);
CREATE INDEX IF NOT EXISTS idx_handoff_from ON public.handoff_requests(from_member_id);
CREATE INDEX IF NOT EXISTS idx_handoff_to ON public.handoff_requests(to_member_id);
CREATE INDEX IF NOT EXISTS idx_handoff_created ON public.handoff_requests(created_at DESC);

CREATE TRIGGER update_handoff_requests_updated_at
  BEFORE UPDATE ON public.handoff_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. redistribution_log
CREATE TABLE public.redistribution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID,
  company_id UUID,
  from_member_id UUID REFERENCES public.sales_team_members(id) ON DELETE SET NULL,
  to_member_id UUID REFERENCES public.sales_team_members(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT 'inactivity' CHECK (reason IN ('inactivity', 'capacity', 'territory_change', 'manual', 'vacation', 'performance')),
  auto_triggered BOOLEAN NOT NULL DEFAULT false,
  inactivity_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.redistribution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redistribution logs"
  ON public.redistribution_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all redistribution logs"
  ON public.redistribution_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own redistribution logs"
  ON public.redistribution_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_redistribution_reason ON public.redistribution_log(reason);
CREATE INDEX IF NOT EXISTS idx_redistribution_created ON public.redistribution_log(created_at DESC);
