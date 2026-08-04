-- Tabela principal de análise RFM
CREATE TABLE public.rfm_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  
  -- Scores RFM (1-5)
  recency_score INTEGER NOT NULL CHECK (recency_score >= 1 AND recency_score <= 5),
  frequency_score INTEGER NOT NULL CHECK (frequency_score >= 1 AND frequency_score <= 5),
  monetary_score INTEGER NOT NULL CHECK (monetary_score >= 1 AND monetary_score <= 5),
  
  -- Score combinado
  rfm_score INTEGER GENERATED ALWAYS AS (recency_score * 100 + frequency_score * 10 + monetary_score) STORED,
  total_score INTEGER GENERATED ALWAYS AS (recency_score + frequency_score + monetary_score) STORED,
  
  -- Métricas brutas
  days_since_last_purchase INTEGER,
  days_since_last_interaction INTEGER,
  total_purchases INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  total_monetary_value DECIMAL(12,2) DEFAULT 0,
  average_order_value DECIMAL(12,2) DEFAULT 0,
  
  -- Segmentação
  segment TEXT NOT NULL,
  segment_description TEXT,
  segment_color TEXT,
  
  -- Tendências
  recency_trend TEXT CHECK (recency_trend IN ('improving', 'stable', 'declining')),
  frequency_trend TEXT CHECK (frequency_trend IN ('improving', 'stable', 'declining')),
  monetary_trend TEXT CHECK (monetary_trend IN ('improving', 'stable', 'declining')),
  overall_trend TEXT CHECK (overall_trend IN ('improving', 'stable', 'declining')),
  
  -- Previsões
  predicted_next_purchase_date DATE,
  predicted_lifetime_value DECIMAL(12,2),
  churn_probability DECIMAL(5,2),
  
  -- Recomendações
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  recommended_offers JSONB DEFAULT '[]'::jsonb,
  communication_priority TEXT CHECK (communication_priority IN ('urgent', 'high', 'medium', 'low')),
  
  -- Metadados
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, contact_id)
);

-- Histórico de RFM para tracking de evolução
CREATE TABLE public.rfm_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  
  recency_score INTEGER NOT NULL,
  frequency_score INTEGER NOT NULL,
  monetary_score INTEGER NOT NULL,
  segment TEXT NOT NULL,
  total_monetary_value DECIMAL(12,2),
  
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configurações de segmentos RFM personalizáveis
CREATE TABLE public.rfm_segment_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  segment_name TEXT NOT NULL,
  segment_key TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  
  -- Regras de segmentação (ranges de scores)
  recency_min INTEGER NOT NULL DEFAULT 1,
  recency_max INTEGER NOT NULL DEFAULT 5,
  frequency_min INTEGER NOT NULL DEFAULT 1,
  frequency_max INTEGER NOT NULL DEFAULT 5,
  monetary_min INTEGER NOT NULL DEFAULT 1,
  monetary_max INTEGER NOT NULL DEFAULT 5,
  
  -- Ações recomendadas para o segmento
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  email_template TEXT,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, segment_key)
);

-- Métricas agregadas de RFM por período
CREATE TABLE public.rfm_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
  
  -- Contagens por segmento
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
  
  -- Métricas gerais
  total_contacts_analyzed INTEGER DEFAULT 0,
  average_rfm_score DECIMAL(5,2),
  average_monetary_value DECIMAL(12,2),
  total_revenue DECIMAL(12,2),
  
  -- Movimentação entre segmentos
  segment_transitions JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, period_start, period_end, period_type)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_user ON public.rfm_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_contact ON public.rfm_analysis(contact_id);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_segment ON public.rfm_analysis(segment);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_scores ON public.rfm_analysis(recency_score, frequency_score, monetary_score);
CREATE INDEX IF NOT EXISTS idx_rfm_history_contact ON public.rfm_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_rfm_history_recorded ON public.rfm_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_rfm_metrics_period ON public.rfm_metrics(user_id, period_start, period_end);

-- Enable RLS
ALTER TABLE public.rfm_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfm_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfm_segment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfm_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own RFM analysis" ON public.rfm_analysis
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own RFM history" ON public.rfm_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their RFM segment config" ON public.rfm_segment_config
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their RFM metrics" ON public.rfm_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_rfm_analysis_updated_at
  BEFORE UPDATE ON public.rfm_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfm_segment_config_updated_at
  BEFORE UPDATE ON public.rfm_segment_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();