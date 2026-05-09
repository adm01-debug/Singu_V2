
-- Adicionar colunas de controle de interação à tabela contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS interactions_count INTEGER DEFAULT 0;

-- Função para calcular o Score de Relacionamento e atualizar metadados do contato
CREATE OR REPLACE FUNCTION public.calculate_relationship_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_contact_id UUID;
    v_score INTEGER := 0;
    v_sentiment TEXT := 'neutral';
    v_interactions_count INTEGER;
    v_last_date TIMESTAMP WITH TIME ZONE;
    v_avg_sentiment FLOAT;
    v_days_since_last INTEGER;
    v_stage TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_contact_id := OLD.contact_id;
    ELSE
        v_contact_id := NEW.contact_id;
    END IF;

    -- 1. Contagem e Última Data
    SELECT count(*), max(created_at)
    INTO v_interactions_count, v_last_date
    FROM public.interactions
    WHERE contact_id = v_contact_id;

    -- 2. Sentimento Médio (Mapeamento Simples)
    -- positive = 100, neutral = 50, negative = 0
    SELECT AVG(CASE 
        WHEN sentiment = 'positive' THEN 100 
        WHEN sentiment = 'negative' THEN 0 
        ELSE 50 END)
    INTO v_avg_sentiment
    FROM public.interactions
    WHERE contact_id = v_contact_id;

    IF v_avg_sentiment > 66 THEN v_sentiment := 'positive';
    ELSIF v_avg_sentiment < 33 THEN v_sentiment := 'negative';
    ELSE v_sentiment := 'neutral';
    END IF;

    -- 3. Cálculo do Score (Lógica simplificada baseada em volume, recência e sentimento)
    -- Base: Sentimento (40%) + Volume (30%) + Recência (30%)
    v_days_since_last := EXTRACT(DAY FROM (now() - v_last_date));
    
    -- Pontos por volume (máximo 30 pontos se > 10 interações)
    v_score := v_score + LEAST(v_interactions_count * 3, 30);
    
    -- Pontos por sentimento (máximo 40 pontos)
    v_score := v_score + (COALESCE(v_avg_sentiment, 50) * 0.4);
    
    -- Pontos por recência (máximo 30 pontos, decai após 7 dias)
    IF v_days_since_last IS NULL THEN
        v_score := v_score + 0;
    ELSIF v_days_since_last <= 7 THEN
        v_score := v_score + 30;
    ELSIF v_days_since_last <= 30 THEN
        v_score := v_score + 15;
    ELSE
        v_score := v_score + 5;
    END IF;

    -- 4. Ajustar Estágio automaticamente se estiver em risco
    SELECT relationship_stage INTO v_stage FROM public.contacts WHERE id = v_contact_id;
    IF v_days_since_last > 45 AND v_stage != 'lost' THEN
        v_stage := 'at_risk';
    END IF;

    -- Atualizar contato
    UPDATE public.contacts
    SET 
        relationship_score = ROUND(v_score),
        sentiment = v_sentiment,
        interactions_count = v_interactions_count,
        last_interaction_at = v_last_date,
        relationship_stage = COALESCE(v_stage, relationship_stage),
        updated_at = now()
    WHERE id = v_contact_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para atualizar métricas sempre que houver nova interação
DROP TRIGGER IF EXISTS tr_update_contact_metrics ON public.interactions;
CREATE TRIGGER tr_update_contact_metrics
AFTER INSERT OR UPDATE OR DELETE ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_relationship_metrics();

-- Tabela de Alertas de CRM (Cadências e Follow-ups)
CREATE TABLE IF NOT EXISTS public.crm_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'at_risk', 'no_contact', 'follow_up'
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    message TEXT NOT NULL,
    suggested_action TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.crm_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alerts"
ON public.crm_alerts
FOR ALL
USING (auth.uid() = user_id);

-- Função para gerar alertas baseados em inatividade
CREATE OR REPLACE FUNCTION public.check_contact_health_alerts()
RETURNS void AS $$
BEGIN
    -- Alertas para contatos sem interação há mais de 15 dias (prospects/qualified_leads)
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'no_contact', 
        'medium',
        'Contato sem interação há ' || EXTRACT(DAY FROM (now() - last_interaction_at)) || ' dias.',
        'Envie uma mensagem de acompanhamento ou agende uma breve ligação.'
    FROM public.contacts
    WHERE last_interaction_at < now() - interval '15 days'
    AND relationship_stage IN ('prospect', 'qualified_lead', 'opportunity')
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'no_contact' 
        AND is_resolved = false
    );

    -- Alertas para clientes em risco (at_risk)
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'at_risk', 
        'high',
        'Cliente marcado como em risco. Score atual: ' || relationship_score,
        'Realize uma reunião de alinhamento imediata para entender as dores.'
    FROM public.contacts
    WHERE relationship_stage = 'at_risk'
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'at_risk' 
        AND is_resolved = false
    );
END;
$$ LANGUAGE plpgsql SET search_path = public;
