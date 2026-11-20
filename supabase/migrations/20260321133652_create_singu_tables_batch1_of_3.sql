-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321133652
-- nome:   create_singu_tables_batch1_of_3

-- Ensure helper function exists
CREATE OR REPLACE FUNCTION public.update_nlp_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. trigger_usage_history
CREATE TABLE IF NOT EXISTS public.trigger_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  template_id TEXT,
  template_title TEXT,
  scenario TEXT,
  channel TEXT,
  context TEXT,
  result TEXT CHECK (result IN ('success', 'neutral', 'failure', 'pending')),
  notes TEXT,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.trigger_usage_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_trigger_usage_history_contact_id ON public.trigger_usage_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_trigger_usage_history_user_id ON public.trigger_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trigger_usage_history_used_at ON public.trigger_usage_history(used_at DESC);

-- 2. favorite_templates
CREATE TABLE IF NOT EXISTS public.favorite_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id)
);
ALTER TABLE public.favorite_templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_favorite_templates_user_id ON public.favorite_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_templates_template_id ON public.favorite_templates(template_id);

-- 3. vak_analysis_history
CREATE TABLE IF NOT EXISTS public.vak_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  visual_score NUMERIC(5,2) DEFAULT 0,
  auditory_score NUMERIC(5,2) DEFAULT 0,
  kinesthetic_score NUMERIC(5,2) DEFAULT 0,
  digital_score NUMERIC(5,2) DEFAULT 0,
  visual_words TEXT[] DEFAULT '{}',
  auditory_words TEXT[] DEFAULT '{}',
  kinesthetic_words TEXT[] DEFAULT '{}',
  digital_words TEXT[] DEFAULT '{}',
  analyzed_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.vak_analysis_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_vak_analysis_contact ON public.vak_analysis_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_vak_analysis_user ON public.vak_analysis_history(user_id);

-- 4. metaprogram_analysis
CREATE TABLE IF NOT EXISTS public.metaprogram_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  interaction_id UUID,
  toward_score INTEGER DEFAULT 0,
  away_from_score INTEGER DEFAULT 0,
  toward_words TEXT[] DEFAULT '{}',
  away_from_words TEXT[] DEFAULT '{}',
  internal_score INTEGER DEFAULT 0,
  external_score INTEGER DEFAULT 0,
  internal_words TEXT[] DEFAULT '{}',
  external_words TEXT[] DEFAULT '{}',
  options_score INTEGER DEFAULT 0,
  procedures_score INTEGER DEFAULT 0,
  options_words TEXT[] DEFAULT '{}',
  procedures_words TEXT[] DEFAULT '{}',
  analyzed_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.metaprogram_analysis ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_metaprogram_analysis_contact ON public.metaprogram_analysis(contact_id);
CREATE INDEX IF NOT EXISTS idx_metaprogram_analysis_user ON public.metaprogram_analysis(user_id);

-- 5. compatibility_alerts
CREATE TABLE IF NOT EXISTS public.compatibility_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  compatibility_score INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'below_threshold',
  title TEXT NOT NULL,
  description TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.compatibility_alerts ENABLE ROW LEVEL SECURITY;

-- 6. compatibility_settings
CREATE TABLE IF NOT EXISTS public.compatibility_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  alert_threshold INTEGER NOT NULL DEFAULT 50,
  alert_only_important BOOLEAN DEFAULT true,
  important_min_relationship_score INTEGER DEFAULT 70,
  email_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.compatibility_settings ENABLE ROW LEVEL SECURITY;

-- 7. emotional_states_history
CREATE TABLE IF NOT EXISTS public.emotional_states_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  emotional_state TEXT NOT NULL,
  confidence INTEGER DEFAULT 50,
  trigger TEXT,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.emotional_states_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_emotional_states_contact ON public.emotional_states_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_emotional_states_created ON public.emotional_states_history(created_at DESC);

-- 8. client_values
CREATE TABLE IF NOT EXISTS public.client_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  value_name TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  detected_phrases TEXT[],
  frequency INTEGER DEFAULT 1,
  last_mentioned TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id, category, value_name)
);
ALTER TABLE public.client_values ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_client_values_contact ON public.client_values(contact_id);

-- 9. hidden_objections
CREATE TABLE IF NOT EXISTS public.hidden_objections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  objection_type TEXT NOT NULL,
  indicator TEXT NOT NULL,
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  possible_real_objection TEXT,
  suggested_probe TEXT,
  resolution_templates TEXT[],
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hidden_objections ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_hidden_objections_contact ON public.hidden_objections(contact_id);
CREATE INDEX IF NOT EXISTS idx_hidden_objections_resolved ON public.hidden_objections(resolved);

-- 10. eq_analysis_history
CREATE TABLE IF NOT EXISTS public.eq_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  overall_level TEXT NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  pillar_scores JSONB NOT NULL,
  indicators JSONB,
  strengths TEXT[],
  areas_for_growth TEXT[],
  sales_implications JSONB,
  communication_style JSONB,
  profile_summary TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.eq_analysis_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_contact_id ON public.eq_analysis_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_user_id ON public.eq_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_analyzed_at ON public.eq_analysis_history(analyzed_at DESC);

-- 11. cognitive_bias_history
CREATE TABLE IF NOT EXISTS public.cognitive_bias_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  detected_biases JSONB NOT NULL,
  category_distribution JSONB,
  dominant_biases TEXT[],
  vulnerabilities TEXT[],
  resistances TEXT[],
  sales_strategies JSONB,
  profile_summary TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.cognitive_bias_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_contact_id ON public.cognitive_bias_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_user_id ON public.cognitive_bias_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_analyzed_at ON public.cognitive_bias_history(analyzed_at DESC);

-- 12. stakeholder_alerts
CREATE TABLE IF NOT EXISTS public.stakeholder_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  previous_value JSONB,
  current_value JSONB,
  recommended_action TEXT,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.stakeholder_alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_user_contact ON public.stakeholder_alerts(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_dismissed ON public.stakeholder_alerts(user_id, dismissed);

-- 13. health_alert_settings
CREATE TABLE IF NOT EXISTS public.health_alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  critical_threshold INTEGER DEFAULT 30,
  warning_threshold INTEGER DEFAULT 50,
  check_frequency_hours INTEGER DEFAULT 24,
  notify_on_critical BOOLEAN DEFAULT true,
  notify_on_warning BOOLEAN DEFAULT false,
  email_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_health_settings UNIQUE (user_id)
);
ALTER TABLE public.health_alert_settings ENABLE ROW LEVEL SECURITY;

-- 14. weekly_report_settings
CREATE TABLE IF NOT EXISTS public.weekly_report_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  enabled BOOLEAN DEFAULT true,
  send_day TEXT DEFAULT 'monday',
  send_time TEXT DEFAULT '09:00',
  email_address TEXT,
  include_portfolio_summary BOOLEAN DEFAULT true,
  include_at_risk_clients BOOLEAN DEFAULT true,
  include_health_alerts BOOLEAN DEFAULT true,
  include_upcoming_dates BOOLEAN DEFAULT true,
  include_recommendations BOOLEAN DEFAULT true,
  include_performance_metrics BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_report_settings UNIQUE (user_id)
);
ALTER TABLE public.weekly_report_settings ENABLE ROW LEVEL SECURITY;

-- 15. contact_time_analysis
CREATE TABLE IF NOT EXISTS public.contact_time_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  hour_of_day INTEGER NOT NULL,
  success_count INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  avg_response_time_minutes INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_id, day_of_week, hour_of_day)
);
ALTER TABLE public.contact_time_analysis ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_contact_time_analysis_contact ON public.contact_time_analysis(contact_id);
