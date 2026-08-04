-- Tabela para armazenar dados de perfis sociais coletados
CREATE TABLE public.social_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- 'linkedin', 'twitter', 'instagram'
  profile_url TEXT,
  profile_data JSONB, -- dados brutos do perfil
  headline TEXT, -- título/bio
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

-- Tabela para histórico de mudanças detectadas (eventos de vida)
CREATE TABLE public.social_life_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'promotion', 'new_job', 'company_change', 'certification', 'education', 'anniversary', 'post_viral', 'engagement_spike'
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

-- Tabela para análise comportamental baseada em redes sociais
CREATE TABLE public.social_behavior_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Traços de personalidade detectados
  personality_traits JSONB,
  -- Estilo de comunicação inferido
  communication_style JSONB,
  -- Interesses e tópicos frequentes
  interests TEXT[],
  topics TEXT[],
  -- Sentimento geral dos posts
  overall_sentiment TEXT,
  sentiment_score NUMERIC(3,2),
  -- Horários de atividade
  active_hours JSONB,
  active_days TEXT[],
  -- Nível de influência
  influence_level TEXT, -- 'thought_leader', 'active_contributor', 'passive_observer', 'lurker'
  influence_score NUMERIC(3,2),
  -- Palavras-chave e hashtags frequentes
  keywords TEXT[],
  hashtags TEXT[],
  -- Conexões de valor
  valuable_connections JSONB,
  -- Insights de vendas
  sales_insights JSONB,
  -- Resumo executivo
  executive_summary TEXT,
  
  confidence NUMERIC(3,2) DEFAULT 0.7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para agendamento de scraping
CREATE TABLE public.social_scraping_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  frequency_days INTEGER DEFAULT 7, -- frequência de scraping em dias
  priority TEXT DEFAULT 'normal', -- 'high', 'normal', 'low'
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, platform)
);

-- Enable RLS
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_life_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_behavior_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_scraping_schedule ENABLE ROW LEVEL SECURITY;

-- Policies for social_profiles
CREATE POLICY "Users can view their own social profiles" ON public.social_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own social profiles" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own social profiles" ON public.social_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own social profiles" ON public.social_profiles FOR DELETE USING (auth.uid() = user_id);

-- Policies for social_life_events
CREATE POLICY "Users can view their own social life events" ON public.social_life_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own social life events" ON public.social_life_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own social life events" ON public.social_life_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own social life events" ON public.social_life_events FOR DELETE USING (auth.uid() = user_id);

-- Policies for social_behavior_analysis
CREATE POLICY "Users can view their own social behavior analysis" ON public.social_behavior_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own social behavior analysis" ON public.social_behavior_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own social behavior analysis" ON public.social_behavior_analysis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own social behavior analysis" ON public.social_behavior_analysis FOR DELETE USING (auth.uid() = user_id);

-- Policies for social_scraping_schedule
CREATE POLICY "Users can view their own scraping schedule" ON public.social_scraping_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scraping schedule" ON public.social_scraping_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scraping schedule" ON public.social_scraping_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scraping schedule" ON public.social_scraping_schedule FOR DELETE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_social_profiles_contact ON public.social_profiles(contact_id);
CREATE INDEX IF NOT EXISTS idx_social_profiles_platform ON public.social_profiles(platform);
CREATE INDEX IF NOT EXISTS idx_social_life_events_contact ON public.social_life_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_social_life_events_type ON public.social_life_events(event_type);
CREATE INDEX IF NOT EXISTS idx_social_life_events_date ON public.social_life_events(event_date);
CREATE INDEX IF NOT EXISTS idx_social_behavior_analysis_contact ON public.social_behavior_analysis(contact_id);
CREATE INDEX IF NOT EXISTS idx_social_scraping_schedule_next ON public.social_scraping_schedule(next_run_at) WHERE enabled = true;

-- Trigger para updated_at
CREATE TRIGGER update_social_profiles_updated_at BEFORE UPDATE ON public.social_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_social_scraping_schedule_updated_at BEFORE UPDATE ON public.social_scraping_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();