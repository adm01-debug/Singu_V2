
-- =====================================================
-- DISC ANALYSIS ENTERPRISE MODULE - COMPLETE SYSTEM
-- =====================================================

-- 1. Table: disc_analysis_history - Complete history tracking
CREATE TABLE public.disc_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  
  -- Individual DISC Scores (0-100 intensity for each dimension)
  dominance_score INTEGER NOT NULL DEFAULT 0 CHECK (dominance_score >= 0 AND dominance_score <= 100),
  influence_score INTEGER NOT NULL DEFAULT 0 CHECK (influence_score >= 0 AND influence_score <= 100),
  steadiness_score INTEGER NOT NULL DEFAULT 0 CHECK (steadiness_score >= 0 AND steadiness_score <= 100),
  conscientiousness_score INTEGER NOT NULL DEFAULT 0 CHECK (conscientiousness_score >= 0 AND conscientiousness_score <= 100),
  
  -- Primary & Secondary Profile (calculated from scores)
  primary_profile TEXT NOT NULL CHECK (primary_profile IN ('D', 'I', 'S', 'C')),
  secondary_profile TEXT CHECK (secondary_profile IN ('D', 'I', 'S', 'C')),
  blend_profile TEXT, -- e.g., 'DI', 'SC', 'DC', 'IS'
  
  -- Stress Profile (how profile changes under pressure)
  stress_primary TEXT CHECK (stress_primary IN ('D', 'I', 'S', 'C')),
  stress_secondary TEXT CHECK (stress_secondary IN ('D', 'I', 'S', 'C')),
  
  -- Analysis Confidence & Source
  confidence INTEGER NOT NULL DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  analysis_source TEXT NOT NULL DEFAULT 'manual' CHECK (analysis_source IN ('manual', 'ai_analysis', 'questionnaire', 'behavior_tracking')),
  
  -- Supporting evidence
  detected_keywords JSONB DEFAULT '[]'::jsonb,
  detected_phrases JSONB DEFAULT '[]'::jsonb,
  behavior_indicators JSONB DEFAULT '[]'::jsonb,
  
  -- Analysis metadata
  analyzed_text TEXT,
  analysis_notes TEXT,
  profile_summary TEXT,
  
  -- Timestamps
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Table: disc_profile_config - Extended DISC profile configuration
CREATE TABLE public.disc_profile_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_type TEXT NOT NULL UNIQUE CHECK (profile_type IN ('D', 'I', 'S', 'C', 'DI', 'DC', 'ID', 'IS', 'SI', 'SC', 'CS', 'CD')),
  
  -- Basic info
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  detailed_description TEXT NOT NULL,
  
  -- Behavioral patterns
  core_drive TEXT NOT NULL,
  core_fear TEXT NOT NULL,
  under_pressure TEXT NOT NULL,
  ideal_environment TEXT NOT NULL,
  
  -- Communication preferences
  communication_style JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferred_pace TEXT NOT NULL,
  decision_making_style TEXT NOT NULL,
  
  -- Sales approach strategies
  opening_strategies JSONB NOT NULL DEFAULT '[]'::jsonb,
  presentation_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  objection_handling JSONB NOT NULL DEFAULT '[]'::jsonb,
  closing_techniques JSONB NOT NULL DEFAULT '[]'::jsonb,
  follow_up_approach JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Language patterns
  power_words JSONB NOT NULL DEFAULT '[]'::jsonb,
  avoid_words JSONB NOT NULL DEFAULT '[]'::jsonb,
  detection_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  typical_phrases JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Compatibility matrix (scores 0-100 with each type)
  compatibility_matrix JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Visual styling
  color_scheme JSONB NOT NULL DEFAULT '{}'::jsonb,
  icon TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Table: disc_conversion_metrics - Track sales outcomes by DISC profile
CREATE TABLE public.disc_conversion_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- DISC profile being analyzed
  disc_profile TEXT NOT NULL CHECK (disc_profile IN ('D', 'I', 'S', 'C')),
  blend_profile TEXT,
  
  -- Metrics
  total_contacts INTEGER NOT NULL DEFAULT 0,
  total_opportunities INTEGER NOT NULL DEFAULT 0,
  converted_count INTEGER NOT NULL DEFAULT 0,
  lost_count INTEGER NOT NULL DEFAULT 0,
  
  -- Rates (calculated)
  conversion_rate NUMERIC(5,2),
  average_deal_size NUMERIC,
  average_sales_cycle_days INTEGER,
  
  -- Relationship analysis
  average_relationship_score NUMERIC(5,2),
  average_compatibility_score NUMERIC(5,2),
  
  -- Time-based analysis
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint per user per period per profile
  UNIQUE (user_id, disc_profile, period_start, period_end)
);

-- 4. Table: disc_communication_logs - Track how you communicate with each profile
CREATE TABLE public.disc_communication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  
  -- The profile at time of communication
  contact_disc_profile TEXT NOT NULL CHECK (contact_disc_profile IN ('D', 'I', 'S', 'C')),
  
  -- Communication approach used
  approach_adapted BOOLEAN NOT NULL DEFAULT false,
  adaptation_tips_shown JSONB DEFAULT '[]'::jsonb,
  tips_followed JSONB DEFAULT '[]'::jsonb,
  
  -- Outcome
  communication_outcome TEXT CHECK (communication_outcome IN ('positive', 'neutral', 'negative')),
  outcome_notes TEXT,
  
  -- Self-assessment
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.disc_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disc_profile_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disc_conversion_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disc_communication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disc_analysis_history
CREATE POLICY "Users can view their own DISC analysis history"
  ON public.disc_analysis_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own DISC analysis"
  ON public.disc_analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DISC analysis"
  ON public.disc_analysis_history FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for disc_profile_config (public read, admin write)
CREATE POLICY "Everyone can view DISC profile configs"
  ON public.disc_profile_config FOR SELECT
  USING (true);

-- RLS Policies for disc_conversion_metrics
CREATE POLICY "Users can view their own DISC conversion metrics"
  ON public.disc_conversion_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own DISC conversion metrics"
  ON public.disc_conversion_metrics FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for disc_communication_logs
CREATE POLICY "Users can view their own DISC communication logs"
  ON public.disc_communication_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own DISC communication logs"
  ON public.disc_communication_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DISC communication logs"
  ON public.disc_communication_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_contact ON public.disc_analysis_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_user ON public.disc_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_analyzed_at ON public.disc_analysis_history(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_disc_conversion_metrics_user ON public.disc_conversion_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_disc_communication_logs_contact ON public.disc_communication_logs(contact_id);
