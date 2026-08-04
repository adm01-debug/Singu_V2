
-- 1. Logs de Automação (Audit Trail)
CREATE TABLE IF NOT EXISTS public.crm_automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    automation_name TEXT NOT NULL, -- 'score_update', 'alert_generation', 'whatsapp_ingestion'
    status TEXT NOT NULL, -- 'success', 'failed', 'pending'
    payload JSONB, -- Dados de entrada
    result JSONB, -- Dados de saída ou erro
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.crm_automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own automation logs" ON public.crm_automation_logs FOR SELECT USING (auth.uid() = user_id);

-- 2. Regras de Cadência Personalizáveis
CREATE TABLE IF NOT EXISTS public.crm_cadence_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    relationship_stage TEXT NOT NULL, -- 'prospect', 'negotiation', etc.
    frequency_days INTEGER NOT NULL,
    priority TEXT DEFAULT 'medium',
    suggested_actions TEXT[],
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, relationship_stage, version)
);

ALTER TABLE public.crm_cadence_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own cadence rules" ON public.crm_cadence_rules FOR ALL USING (auth.uid() = user_id);

-- 3. Overrides Manuais de Métricas (Explicabilidade e Controle)
CREATE TABLE IF NOT EXISTS public.crm_metric_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'score', 'sentiment', 'last_contact'
    old_value TEXT,
    new_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.crm_metric_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own overrides" ON public.crm_metric_overrides FOR ALL USING (auth.uid() = user_id);

-- 4. Função para Explicabilidade do Score (Calculada on-the-fly para o Front-End)
CREATE OR REPLACE FUNCTION public.get_score_explicability(p_contact_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_contact RECORD;
    v_interactions_count INTEGER;
    v_last_date TIMESTAMP WITH TIME ZONE;
    v_avg_sentiment FLOAT;
    v_days_since_last INTEGER;
    v_factors JSONB;
BEGIN
    SELECT * INTO v_contact FROM public.contacts WHERE id = p_contact_id;
    
    SELECT count(*), max(created_at) INTO v_interactions_count, v_last_date
    FROM public.interactions WHERE contact_id = p_contact_id;
    
    v_days_since_last := EXTRACT(DAY FROM (now() - v_last_date));

    SELECT AVG(CASE WHEN sentiment = 'positive' THEN 100 WHEN sentiment = 'negative' THEN 0 ELSE 50 END)
    INTO v_avg_sentiment FROM public.interactions WHERE contact_id = p_contact_id;

    v_factors := jsonb_build_object(
        'volume', jsonb_build_object('value', v_interactions_count, 'impact', LEAST(v_interactions_count * 10, 100) * 0.4),
        'sentiment', jsonb_build_object('value', COALESCE(v_avg_sentiment, 50), 'impact', COALESCE(v_avg_sentiment, 50) * 0.3),
        'recency', jsonb_build_object('days', v_days_since_last, 'impact', 
            CASE 
                WHEN v_days_since_last <= 7 THEN 30 
                WHEN v_days_since_last <= 30 THEN 15 
                ELSE 0 
            END)
    );

    RETURN jsonb_build_object(
        'current_score', v_contact.relationship_score,
        'stage', v_contact.relationship_stage,
        'factors', v_factors
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
