-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321133745
-- nome:   create_singu_tables_batch2_of_3

-- 16. contact_cadence
CREATE TABLE IF NOT EXISTS public.contact_cadence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  cadence_days INTEGER NOT NULL DEFAULT 14,
  priority VARCHAR(20) DEFAULT 'medium',
  auto_remind BOOLEAN DEFAULT true,
  last_contact_at TIMESTAMPTZ,
  next_contact_due TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id)
);
ALTER TABLE public.contact_cadence ENABLE ROW LEVEL SECURITY;

-- 17. contact_preferences
CREATE TABLE IF NOT EXISTS public.contact_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  preferred_channel VARCHAR(50) DEFAULT 'whatsapp',
  preferred_days TEXT[] DEFAULT '{}',
  preferred_times TEXT[] DEFAULT '{}',
  avoid_days TEXT[] DEFAULT '{}',
  avoid_times TEXT[] DEFAULT '{}',
  restrictions TEXT,
  personal_notes TEXT,
  communication_tips TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id)
);
ALTER TABLE public.contact_preferences ENABLE ROW LEVEL SECURITY;

-- 18. score_history
CREATE TABLE IF NOT EXISTS public.score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score_type TEXT NOT NULL CHECK (score_type IN ('closing', 'health', 'churn', 'relationship', 'satisfaction')),
  score_value NUMERIC(5,2) NOT NULL,
  previous_value NUMERIC(5,2),
  factors JSONB,
  metadata JSONB,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_score_history_contact_id ON public.score_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_score_history_user_id ON public.score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_score_history_score_type ON public.score_history(score_type);
CREATE INDEX IF NOT EXISTS idx_score_history_calculated_at ON public.score_history(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_composite ON public.score_history(contact_id, score_type, calculated_at DESC);

-- 19-22. Social module
CREATE TABLE IF NOT EXISTS public.social_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  profile_url TEXT,
  profile_data JSONB,
  headline TEXT,
  current_company TEXT,
  current_position TEXT,
  location TEXT,
  connections_count INTEGER,
  followers_count INTEGER,
  following_count INTEGER,
  profile_image_url TEXT,
  cover_image_url TEXT,
  skills TEXT[],
  certifications TEXT[],
  education JSONB,
  experience JSONB,
  recent_posts JSONB,
  engagement_metrics JSONB,
  last_scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_social_profiles_contact ON public.social_profiles(contact_id);
CREATE INDEX IF NOT EXISTS idx_social_profiles_platform ON public.social_profiles(platform);

CREATE TABLE IF NOT EXISTS public.social_life_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  previous_value TEXT,
  new_value TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.8,
  metadata JSONB,
  notified BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.social_life_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_social_life_events_contact ON public.social_life_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_social_life_events_type ON public.social_life_events(event_type);
CREATE INDEX IF NOT EXISTS idx_social_life_events_date ON public.social_life_events(event_date);

CREATE TABLE IF NOT EXISTS public.social_behavior_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  personality_traits JSONB,
  communication_style JSONB,
  interests TEXT[],
  topics TEXT[],
  overall_sentiment TEXT,
  sentiment_score NUMERIC(3,2),
  active_hours JSONB,
  active_days TEXT[],
  influence_level TEXT,
  influence_score NUMERIC(3,2),
  keywords TEXT[],
  hashtags TEXT[],
  valuable_connections JSONB,
  sales_insights JSONB,
  executive_summary TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.social_behavior_analysis ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_social_behavior_analysis_contact ON public.social_behavior_analysis(contact_id);

CREATE TABLE IF NOT EXISTS public.social_scraping_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  frequency_days INTEGER DEFAULT 7,
  priority TEXT DEFAULT 'normal',
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, platform)
);
ALTER TABLE public.social_scraping_schedule ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_social_scraping_schedule_next ON public.social_scraping_schedule(next_run_at) WHERE enabled = true;

-- 23-24. RFM (rfm_analysis + rfm_metrics)
CREATE TABLE IF NOT EXISTS public.rfm_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  recency_score INTEGER NOT NULL CHECK (recency_score >= 1 AND recency_score <= 5),
  frequency_score INTEGER NOT NULL CHECK (frequency_score >= 1 AND frequency_score <= 5),
  monetary_score INTEGER NOT NULL CHECK (monetary_score >= 1 AND monetary_score <= 5),
  rfm_score INTEGER GENERATED ALWAYS AS (recency_score * 100 + frequency_score * 10 + monetary_score) STORED,
  total_score INTEGER GENERATED ALWAYS AS (recency_score + frequency_score + monetary_score) STORED,
  days_since_last_purchase INTEGER,
  days_since_last_interaction INTEGER,
  total_purchases INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  total_monetary_value DECIMAL(12,2) DEFAULT 0,
  average_order_value DECIMAL(12,2) DEFAULT 0,
  segment TEXT NOT NULL,
  segment_description TEXT,
  segment_color TEXT,
  recency_trend TEXT CHECK (recency_trend IN ('improving', 'stable', 'declining')),
  frequency_trend TEXT CHECK (frequency_trend IN ('improving', 'stable', 'declining')),
  monetary_trend TEXT CHECK (monetary_trend IN ('improving', 'stable', 'declining')),
  overall_trend TEXT CHECK (overall_trend IN ('improving', 'stable', 'declining')),
  predicted_next_purchase_date DATE,
  predicted_lifetime_value DECIMAL(12,2),
  churn_probability DECIMAL(5,2),
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  recommended_offers JSONB DEFAULT '[]'::jsonb,
  communication_priority TEXT CHECK (communication_priority IN ('urgent', 'high', 'medium', 'low')),
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id)
);
ALTER TABLE public.rfm_analysis ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_user ON public.rfm_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_contact ON public.rfm_analysis(contact_id);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_segment ON public.rfm_analysis(segment);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_scores ON public.rfm_analysis(recency_score, frequency_score, monetary_score);

CREATE TABLE IF NOT EXISTS public.rfm_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
  champions_count INTEGER DEFAULT 0,
  loyal_count INTEGER DEFAULT 0,
  potential_loyalist_count INTEGER DEFAULT 0,
  recent_customers_count INTEGER DEFAULT 0,
  promising_count INTEGER DEFAULT 0,
  needing_attention_count INTEGER DEFAULT 0,
  about_to_sleep_count INTEGER DEFAULT 0,
  at_risk_count INTEGER DEFAULT 0,
  cant_lose_count INTEGER DEFAULT 0,
  hibernating_count INTEGER DEFAULT 0,
  lost_count INTEGER DEFAULT 0,
  total_contacts_analyzed INTEGER DEFAULT 0,
  average_rfm_score DECIMAL(5,2),
  average_monetary_value DECIMAL(12,2),
  total_revenue DECIMAL(12,2),
  segment_transitions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start, period_end, period_type)
);
ALTER TABLE public.rfm_metrics ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_rfm_metrics_period ON public.rfm_metrics(user_id, period_start, period_end);

-- 25-27. DISC (analysis_history + conversion_metrics + communication_logs)
CREATE TABLE IF NOT EXISTS public.disc_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  dominance_score INTEGER NOT NULL DEFAULT 0 CHECK (dominance_score >= 0 AND dominance_score <= 100),
  influence_score INTEGER NOT NULL DEFAULT 0 CHECK (influence_score >= 0 AND influence_score <= 100),
  steadiness_score INTEGER NOT NULL DEFAULT 0 CHECK (steadiness_score >= 0 AND steadiness_score <= 100),
  conscientiousness_score INTEGER NOT NULL DEFAULT 0 CHECK (conscientiousness_score >= 0 AND conscientiousness_score <= 100),
  primary_profile TEXT NOT NULL CHECK (primary_profile IN ('D', 'I', 'S', 'C')),
  secondary_profile TEXT CHECK (secondary_profile IN ('D', 'I', 'S', 'C')),
  blend_profile TEXT,
  stress_primary TEXT CHECK (stress_primary IN ('D', 'I', 'S', 'C')),
  stress_secondary TEXT CHECK (stress_secondary IN ('D', 'I', 'S', 'C')),
  confidence INTEGER NOT NULL DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  analysis_source TEXT NOT NULL DEFAULT 'manual' CHECK (analysis_source IN ('manual', 'ai_analysis', 'questionnaire', 'behavior_tracking')),
  detected_keywords JSONB DEFAULT '[]'::jsonb,
  detected_phrases JSONB DEFAULT '[]'::jsonb,
  behavior_indicators JSONB DEFAULT '[]'::jsonb,
  analyzed_text TEXT,
  analysis_notes TEXT,
  profile_summary TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.disc_analysis_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_contact ON public.disc_analysis_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_user ON public.disc_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_analyzed_at ON public.disc_analysis_history(analyzed_at DESC);

CREATE TABLE IF NOT EXISTS public.disc_conversion_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  disc_profile TEXT NOT NULL CHECK (disc_profile IN ('D', 'I', 'S', 'C')),
  blend_profile TEXT,
  total_contacts INTEGER NOT NULL DEFAULT 0,
  total_opportunities INTEGER NOT NULL DEFAULT 0,
  converted_count INTEGER NOT NULL DEFAULT 0,
  lost_count INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  average_deal_size NUMERIC,
  average_sales_cycle_days INTEGER,
  average_relationship_score NUMERIC(5,2),
  average_compatibility_score NUMERIC(5,2),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, disc_profile, period_start, period_end)
);
ALTER TABLE public.disc_conversion_metrics ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_disc_conversion_metrics_user ON public.disc_conversion_metrics(user_id);

CREATE TABLE IF NOT EXISTS public.disc_communication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  contact_disc_profile TEXT NOT NULL CHECK (contact_disc_profile IN ('D', 'I', 'S', 'C')),
  approach_adapted BOOLEAN NOT NULL DEFAULT false,
  adaptation_tips_shown JSONB DEFAULT '[]'::jsonb,
  tips_followed JSONB DEFAULT '[]'::jsonb,
  communication_outcome TEXT CHECK (communication_outcome IN ('positive', 'neutral', 'negative')),
  outcome_notes TEXT,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.disc_communication_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_disc_communication_logs_contact ON public.disc_communication_logs(contact_id);
