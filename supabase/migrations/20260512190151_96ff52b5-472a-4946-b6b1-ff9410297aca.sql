-- Add missing columns to contact_behavior for Sales 10/10 excellence
ALTER TABLE public.contact_behavior
ADD COLUMN IF NOT EXISTS decision_speed TEXT,
ADD COLUMN IF NOT EXISTS decision_criteria TEXT[],
ADD COLUMN IF NOT EXISTS needs_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES public.contacts(id),
ADD COLUMN IF NOT EXISTS budget_authority BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS decision_role TEXT,
ADD COLUMN IF NOT EXISTS decision_power INTEGER CHECK (decision_power >= 1 AND decision_power <= 10),
ADD COLUMN IF NOT EXISTS support_level INTEGER CHECK (support_level >= 1 AND support_level <= 10),
ADD COLUMN IF NOT EXISTS influencer_ids UUID[],
ADD COLUMN IF NOT EXISTS company_financial_health TEXT,
ADD COLUMN IF NOT EXISTS current_challenges TEXT[],
ADD COLUMN IF NOT EXISTS current_competitors TEXT[],
ADD COLUMN IF NOT EXISTS best_time_to_approach TEXT,
ADD COLUMN IF NOT EXISTS seasonal_notes TEXT;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_contact_behavior_contact_id ON public.contact_behavior(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_behavior_approver_id ON public.contact_behavior(approver_id);
