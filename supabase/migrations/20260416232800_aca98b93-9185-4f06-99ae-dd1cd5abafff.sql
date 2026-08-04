-- ABM Accounts
CREATE TABLE public.abm_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  external_company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  parent_account_id UUID REFERENCES public.abm_accounts(id) ON DELETE SET NULL,
  tier TEXT NOT NULL DEFAULT 'mid' CHECK (tier IN ('strategic','enterprise','mid','smb')),
  account_score INT NOT NULL DEFAULT 0 CHECK (account_score >= 0 AND account_score <= 100),
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','nurture','closed_won','closed_lost','paused')),
  assigned_to UUID,
  target_revenue NUMERIC,
  notes TEXT,
  last_scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, external_company_id)
);
CREATE INDEX IF NOT EXISTS idx_abm_accounts_user ON public.abm_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_abm_accounts_parent ON public.abm_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_abm_accounts_tier ON public.abm_accounts(user_id, tier);
CREATE INDEX IF NOT EXISTS idx_abm_accounts_external ON public.abm_accounts(external_company_id);

ALTER TABLE public.abm_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abm_accounts_select" ON public.abm_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "abm_accounts_insert" ON public.abm_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "abm_accounts_update" ON public.abm_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "abm_accounts_delete" ON public.abm_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER abm_accounts_updated_at BEFORE UPDATE ON public.abm_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER abm_accounts_audit AFTER INSERT OR UPDATE OR DELETE ON public.abm_accounts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ABM Account Plans
CREATE TABLE public.abm_account_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.abm_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'strategic' CHECK (template_type IN ('strategic','growth','retention','penetration')),
  goal TEXT,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  strategies JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_stakeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','archived')),
  target_revenue NUMERIC,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abm_plans_account ON public.abm_account_plans(account_id);
CREATE INDEX IF NOT EXISTS idx_abm_plans_user ON public.abm_account_plans(user_id);

ALTER TABLE public.abm_account_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abm_plans_select" ON public.abm_account_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "abm_plans_insert" ON public.abm_account_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "abm_plans_update" ON public.abm_account_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "abm_plans_delete" ON public.abm_account_plans FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER abm_plans_updated_at BEFORE UPDATE ON public.abm_account_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER abm_plans_audit AFTER INSERT OR UPDATE OR DELETE ON public.abm_account_plans
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ABM Buying Committee
CREATE TABLE public.abm_buying_committee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.abm_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  external_contact_id TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_role TEXT,
  committee_role TEXT NOT NULL CHECK (committee_role IN ('decision_maker','influencer','champion','blocker','user','technical','economic')),
  influence_level INT NOT NULL DEFAULT 5 CHECK (influence_level BETWEEN 1 AND 10),
  engagement_score INT NOT NULL DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abm_committee_account ON public.abm_buying_committee(account_id);
CREATE INDEX IF NOT EXISTS idx_abm_committee_user ON public.abm_buying_committee(user_id);

ALTER TABLE public.abm_buying_committee ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abm_committee_select" ON public.abm_buying_committee FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "abm_committee_insert" ON public.abm_buying_committee FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "abm_committee_update" ON public.abm_buying_committee FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "abm_committee_delete" ON public.abm_buying_committee FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER abm_committee_updated_at BEFORE UPDATE ON public.abm_buying_committee
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ABM Whitespace Opportunities
CREATE TABLE public.abm_whitespace_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.abm_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('cross_sell','up_sell','expansion','renewal')),
  product_category TEXT NOT NULL,
  estimated_value NUMERIC,
  confidence INT NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified','pursuing','won','lost','dismissed')),
  identified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abm_whitespace_account ON public.abm_whitespace_opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_abm_whitespace_user ON public.abm_whitespace_opportunities(user_id);

ALTER TABLE public.abm_whitespace_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abm_whitespace_select" ON public.abm_whitespace_opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "abm_whitespace_insert" ON public.abm_whitespace_opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "abm_whitespace_update" ON public.abm_whitespace_opportunities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "abm_whitespace_delete" ON public.abm_whitespace_opportunities FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER abm_whitespace_updated_at BEFORE UPDATE ON public.abm_whitespace_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ABM Campaigns
CREATE TABLE public.abm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('one_to_one','one_to_few','one_to_many')),
  target_account_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  channels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','archived')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abm_campaigns_user ON public.abm_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_abm_campaigns_status ON public.abm_campaigns(user_id, status);

ALTER TABLE public.abm_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abm_campaigns_select" ON public.abm_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "abm_campaigns_insert" ON public.abm_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "abm_campaigns_update" ON public.abm_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "abm_campaigns_delete" ON public.abm_campaigns FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER abm_campaigns_updated_at BEFORE UPDATE ON public.abm_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();