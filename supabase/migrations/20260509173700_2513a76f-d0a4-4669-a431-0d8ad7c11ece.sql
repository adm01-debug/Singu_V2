
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
    v_recency_weight FLOAT := 0.3;
    v_volume_weight FLOAT := 0.3;
    v_sentiment_weight FLOAT := 0.4;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_contact_id := OLD.contact_id;
    ELSE
        v_contact_id := NEW.contact_id;
    END IF;

    -- 1. Dados Base
    SELECT count(*), max(created_at)
    INTO v_interactions_count, v_last_date
    FROM public.interactions
    WHERE contact_id = v_contact_id;

    -- 2. Estágio Atual
    SELECT relationship_stage INTO v_stage FROM public.contacts WHERE id = v_contact_id;

    -- 3. Ajustar Pesos por Estágio
    IF v_stage IN ('prospect', 'qualified_lead') THEN
        v_recency_weight := 0.5; -- Recência é crucial no início
        v_volume_weight := 0.2;
    ELSIF v_stage IN ('negotiation', 'opportunity') THEN
        v_sentiment_weight := 0.5; -- Sentimento/Acordo é crucial
        v_recency_weight := 0.3;
    ELSIF v_stage IN ('loyal_customer', 'advocate') THEN
        v_volume_weight := 0.5; -- Frequência de uso/contato longo
        v_recency_weight := 0.2;
    END IF;

    -- 4. Sentimento
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

    -- 5. Cálculo do Score
    v_days_since_last := EXTRACT(DAY FROM (now() - v_last_date));
    
    -- Pontos por volume (Base 100, multiplicado pelo peso)
    -- 10+ interações = 100 pontos base
    v_score := v_score + (LEAST(v_interactions_count * 10, 100) * v_volume_weight);
    
    -- Pontos por sentimento (Base 0-100)
    v_score := v_score + (COALESCE(v_avg_sentiment, 50) * v_sentiment_weight);
    
    -- Pontos por recência
    IF v_days_since_last IS NULL THEN
        v_score := v_score + 0;
    ELSIF v_days_since_last <= 3 THEN
        v_score := v_score + (100 * v_recency_weight);
    ELSIF v_days_since_last <= 10 THEN
        v_score := v_score + (70 * v_recency_weight);
    ELSIF v_days_since_last <= 30 THEN
        v_score := v_score + (30 * v_recency_weight);
    ELSE
        v_score := v_score + (0 * v_recency_weight);
    END IF;

    -- 6. Atualização Automática de Estágio (Risco)
    IF v_days_since_last > 45 AND v_stage NOT IN ('lost', 'unknown') THEN
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

-- Refinar alertas diários
CREATE OR REPLACE FUNCTION public.check_contact_health_alerts()
RETURNS void AS $$
BEGIN
    -- 1. Alertas de Inatividade para Prospects/Oportunidades
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'no_contact', 
        'medium',
        'Falta de contato com ' || relationship_stage || ' há ' || EXTRACT(DAY FROM (now() - last_interaction_at)) || ' dias.',
        CASE 
            WHEN relationship_stage = 'prospect' THEN 'Envie um recurso de valor (artigo/ebook) para reaquecer.'
            WHEN relationship_stage = 'qualified_lead' THEN 'Agende uma breve ligação de diagnóstico.'
            WHEN relationship_stage = 'opportunity' THEN 'Apresente um caso de sucesso similar para destravar a decisão.'
            ELSE 'Inicie uma conversa casual para manter o rapport.'
        END
    FROM public.contacts
    WHERE last_interaction_at < now() - interval '15 days'
    AND relationship_stage IN ('prospect', 'qualified_lead', 'opportunity', 'negotiation')
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'no_contact' 
        AND is_resolved = false
    );

    -- 2. Alertas de Risco de Churn (Score Baixo em Clientes)
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'at_risk', 
        'high',
        'Alerta de Churn: Score caiu para ' || relationship_score || '.',
        'Agende uma Reunião de Sucesso (QBR) imediatamente para ouvir as dores do cliente.'
    FROM public.contacts
    WHERE relationship_score < 40
    AND relationship_stage IN ('customer', 'loyal_customer')
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'at_risk' 
        AND is_resolved = false
    );

    -- 3. Alertas de Follow-up para Advocates (Manutenção de Promotores)
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'follow_up', 
        'low',
        'Mantenha seu Promotor engajado! Sem contato há 30 dias.',
        'Convide-o para um evento exclusivo ou peça um depoimento/indicação.'
    FROM public.contacts
    WHERE last_interaction_at < now() - interval '30 days'
    AND relationship_stage = 'advocate'
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'follow_up' 
        AND is_resolved = false
    );
END;
$$ LANGUAGE plpgsql SET search_path = public;
