-- Tabela para logs de chamadas (WhatsApp ou Voz)
CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    status TEXT CHECK (status IN ('completed', 'missed', 'busy', 'failed', 'no-answer')),
    duration_seconds INTEGER DEFAULT 0,
    audio_url TEXT,
    transcription TEXT,
    sentiment TEXT,
    summary TEXT,
    external_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can manage their own call logs" 
ON public.call_logs 
FOR ALL 
USING (auth.uid() = user_id);

-- Função para atualizar métricas de relacionamento automaticamente
CREATE OR REPLACE FUNCTION public.update_contact_relationship_metrics()
RETURNS TRIGGER AS $$
DECLARE
    last_interaction_date TIMESTAMP WITH TIME ZONE;
    interaction_count INTEGER;
    avg_sentiment TEXT;
    new_score INTEGER;
BEGIN
    -- Obter última interação e contagem
    SELECT MAX(created_at), COUNT(*)
    INTO last_interaction_date, interaction_count
    FROM public.interactions
    WHERE contact_id = NEW.contact_id;

    -- Calcular sentimento médio recente (últimas 5)
    SELECT sentiment 
    INTO avg_sentiment
    FROM (
        SELECT sentiment, COUNT(*) as cnt
        FROM public.interactions
        WHERE contact_id = NEW.contact_id
        AND sentiment IS NOT NULL
        GROUP BY sentiment
        ORDER BY cnt DESC, MAX(created_at) DESC
        LIMIT 1
    ) sub;

    -- Motor de Score Simples (0-100)
    -- Base: 20 pts por estágio avançado, bônus por interações, penalidade por dias sem contato
    new_score := 0;
    
    -- Pontos por Estágio
    CASE 
        WHEN (SELECT relationship_stage FROM public.contacts WHERE id = NEW.contact_id) = 'prospect' THEN new_score := 20;
        WHEN (SELECT relationship_stage FROM public.contacts WHERE id = NEW.contact_id) = 'qualified_lead' THEN new_score := 40;
        WHEN (SELECT relationship_stage FROM public.contacts WHERE id = NEW.contact_id) = 'opportunity' THEN new_score := 60;
        WHEN (SELECT relationship_stage FROM public.contacts WHERE id = NEW.contact_id) = 'customer' THEN new_score := 80;
        WHEN (SELECT relationship_stage FROM public.contacts WHERE id = NEW.contact_id) = 'loyal_customer' THEN new_score := 100;
        ELSE new_score := 10;
    END CASE;

    -- Bônus de Atividade (máx +20)
    new_score := new_score + LEAST(interaction_count, 20);

    -- Penalidade por Inatividade
    IF last_interaction_date IS NOT NULL THEN
        new_score := new_score - (EXTRACT(DAY FROM (now() - last_interaction_date))::INTEGER * 2);
    END IF;

    -- Garantir limites
    new_score := GREATEST(0, LEAST(100, new_score));

    -- Atualizar contato
    UPDATE public.contacts
    SET 
        relationship_score = new_score,
        sentiment = COALESCE(avg_sentiment, 'neutral'),
        last_contact_at = last_interaction_date,
        days_without_contact = EXTRACT(DAY FROM (now() - last_interaction_date))::INTEGER,
        interaction_count = interaction_count,
        updated_at = now()
    WHERE id = NEW.contact_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para atualizar métricas após nova interação
DROP TRIGGER IF EXISTS tr_update_relationship_metrics ON public.interactions;
CREATE TRIGGER tr_update_relationship_metrics
AFTER INSERT OR UPDATE ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_contact_relationship_metrics();

-- Função para gerar alertas de "At Risk"
CREATE OR REPLACE FUNCTION public.check_at_risk_contacts()
RETURNS void AS $$
BEGIN
    -- Marcar como at_risk se score cair abaixo de 30 ou > 30 dias sem contato (exceto se já lost)
    UPDATE public.contacts
    SET relationship_stage = 'at_risk'
    WHERE relationship_stage NOT IN ('lost', 'at_risk')
    AND (relationship_score < 30 OR days_without_contact > 30);

    -- Gerar notificações/alertas (se a tabela de alertas existir)
    INSERT INTO public.alerts (user_id, contact_id, title, description, type, priority)
    SELECT user_id, id, 'Contato em Risco', 'O contato está sem interação há mais de 30 dias.', 'relationship', 'high'
    FROM public.contacts
    WHERE relationship_stage = 'at_risk'
    AND NOT EXISTS (
        SELECT 1 FROM public.alerts 
        WHERE contact_id = contacts.id 
        AND title = 'Contato em Risco' 
        AND dismissed = false
    );
END;
$$ LANGUAGE plpgsql SET search_path = public;
