-- ==============================================
-- MENTAL TRIGGERS ENTERPRISE - Advanced Tables
-- A/B Testing, Intensity History, Channel Scores
-- ==============================================

-- 1. NEURAL A/B TESTING TABLE
CREATE TABLE public.trigger_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  disc_profile TEXT,
  
  -- Variant A
  variant_a_trigger TEXT NOT NULL,
  variant_a_template TEXT,
  variant_a_uses INTEGER DEFAULT 0,
  variant_a_conversions INTEGER DEFAULT 0,
  variant_a_avg_rating NUMERIC(3,2) DEFAULT 0,
  
  -- Variant B
  variant_b_trigger TEXT NOT NULL,
  variant_b_template TEXT,
  variant_b_uses INTEGER DEFAULT 0,
  variant_b_conversions INTEGER DEFAULT 0,
  variant_b_avg_rating NUMERIC(3,2) DEFAULT 0,
  
  -- Results
  winner TEXT CHECK (winner IN ('A', 'B', 'tie')),
  confidence NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. TRIGGER INTENSITY HISTORY TABLE
CREATE TABLE public.trigger_intensity_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  intensity_level INTEGER NOT NULL CHECK (intensity_level BETWEEN 1 AND 5),
  result TEXT CHECK (result IN ('success', 'neutral', 'failure', 'resistance')),
  notes TEXT,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. TRIGGER CHANNEL EFFECTIVENESS TABLE
CREATE TABLE public.trigger_channel_effectiveness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'call', 'meeting', 'linkedin', 'sms')),
  uses INTEGER DEFAULT 0,
  successes INTEGER DEFAULT 0,
  effectiveness_score NUMERIC(5,2) DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, contact_id, trigger_type, channel)
);

-- 4. TRIGGER BUNDLES TABLE
CREATE TABLE public.trigger_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  scenario TEXT NOT NULL,
  disc_profiles TEXT[] DEFAULT '{}',
  vak_profiles TEXT[] DEFAULT '{}',
  metaprograms TEXT[] DEFAULT '{}',
  triggers TEXT[] NOT NULL,
  sequence_timing JSONB DEFAULT '[]',
  neural_path JSONB DEFAULT '{}',
  success_rate NUMERIC(5,2) DEFAULT 0,
  total_uses INTEGER DEFAULT 0,
  is_system_bundle BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.trigger_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trigger_intensity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trigger_channel_effectiveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trigger_bundles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trigger_ab_tests
CREATE POLICY "Users can view their own AB tests"
  ON public.trigger_ab_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AB tests"
  ON public.trigger_ab_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AB tests"
  ON public.trigger_ab_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AB tests"
  ON public.trigger_ab_tests FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for trigger_intensity_history
CREATE POLICY "Users can view their own intensity history"
  ON public.trigger_intensity_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own intensity history"
  ON public.trigger_intensity_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intensity history"
  ON public.trigger_intensity_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intensity history"
  ON public.trigger_intensity_history FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for trigger_channel_effectiveness
CREATE POLICY "Users can view their own channel effectiveness"
  ON public.trigger_channel_effectiveness FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own channel effectiveness"
  ON public.trigger_channel_effectiveness FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel effectiveness"
  ON public.trigger_channel_effectiveness FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channel effectiveness"
  ON public.trigger_channel_effectiveness FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for trigger_bundles
CREATE POLICY "Users can view their own bundles"
  ON public.trigger_bundles FOR SELECT
  USING (auth.uid() = user_id OR is_system_bundle = true);

CREATE POLICY "Users can create their own bundles"
  ON public.trigger_bundles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bundles"
  ON public.trigger_bundles FOR UPDATE
  USING (auth.uid() = user_id AND is_system_bundle = false);

CREATE POLICY "Users can delete their own bundles"
  ON public.trigger_bundles FOR DELETE
  USING (auth.uid() = user_id AND is_system_bundle = false);

-- Triggers for updated_at
CREATE TRIGGER update_trigger_ab_tests_updated_at
  BEFORE UPDATE ON public.trigger_ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trigger_channel_effectiveness_updated_at
  BEFORE UPDATE ON public.trigger_channel_effectiveness
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trigger_bundles_updated_at
  BEFORE UPDATE ON public.trigger_bundles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trigger_ab_tests_user_contact ON public.trigger_ab_tests(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_ab_tests_disc ON public.trigger_ab_tests(disc_profile);
CREATE INDEX IF NOT EXISTS idx_trigger_ab_tests_active ON public.trigger_ab_tests(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_trigger_intensity_history_user_contact ON public.trigger_intensity_history(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_intensity_history_trigger ON public.trigger_intensity_history(trigger_type);

CREATE INDEX IF NOT EXISTS idx_trigger_channel_effectiveness_user_contact ON public.trigger_channel_effectiveness(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_channel_effectiveness_trigger_channel ON public.trigger_channel_effectiveness(trigger_type, channel);

CREATE INDEX IF NOT EXISTS idx_trigger_bundles_scenario ON public.trigger_bundles(scenario);
CREATE INDEX IF NOT EXISTS idx_trigger_bundles_system ON public.trigger_bundles(is_system_bundle) WHERE is_system_bundle = true;