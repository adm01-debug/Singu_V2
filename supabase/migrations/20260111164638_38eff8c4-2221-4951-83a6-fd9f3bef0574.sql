-- Create stakeholder_alerts table to track significant changes
CREATE TABLE public.stakeholder_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'blocker_identified', 'champion_disengaging', 'support_dropped', 'risk_increased', 'quadrant_changed', 'engagement_dropped'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  previous_value JSONB,
  current_value JSONB,
  recommended_action TEXT,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stakeholder_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own stakeholder alerts"
ON public.stakeholder_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stakeholder alerts"
ON public.stakeholder_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stakeholder alerts"
ON public.stakeholder_alerts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stakeholder alerts"
ON public.stakeholder_alerts
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_user_contact ON public.stakeholder_alerts(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_dismissed ON public.stakeholder_alerts(user_id, dismissed);