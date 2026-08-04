
CREATE OR REPLACE FUNCTION public.calculate_relationship_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_contact_id UUID;
    v_score FLOAT := 0;
    v_sentiment TEXT := 'neutral';
    v_interactions_count INTEGER;
    v_last_date TIMESTAMP WITH TIME ZONE;
    v_avg_sentiment FLOAT;
    v_days_since_last INTEGER;
    v_stage TEXT;
    
    -- Pesos de Qualidade
    v_quality_score FLOAT := 0;
    v_interaction_record RECORD;
    v_total_quality_weight FLOAT := 0;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_contact_id := OLD.contact_id;
    ELSE
        v_contact_id := NEW.contact_id;
    END IF;

    -- 1. Dados Base e Recência
    SELECT count(*), max(created_at)
    INTO v_interactions_count, v_last_date
    FROM public.interactions
    WHERE contact_id = v_contact_id;

    v_days_since_last := EXTRACT(DAY FROM (now() - v_last_date));

    -- 2. Estágio Atual
    SELECT relationship_stage INTO v_stage FROM public.contacts WHERE id = v_contact_id;

    -- 3. Cálculo de Qualidade (Loop pelas últimas 10 interações para eficiência)
    FOR v_interaction_record IN (
        SELECT type, content, transcription, duration, sentiment, created_at
        FROM public.interactions
        WHERE contact_id = v_contact_id
        ORDER BY created_at DESC
        LIMIT 10
    ) LOOP
        DECLARE
            v_this_weight FLOAT := 1.0;
        BEGIN
            -- Peso por tipo
            IF v_interaction_record.type = 'meeting' THEN v_this_weight := 3.0;
            ELSIF v_interaction_record.type = 'call' THEN v_this_weight := 2.0;
            ELSIF v_interaction_record.type = 'email' THEN v_this_weight := 1.5;
            ELSE v_this_weight := 1.0; -- whatsapp/note
            END IF;

            -- Bônus por profundidade (transcrição ou conteúdo longo)
            IF LENGTH(COALESCE(v_interaction_record.transcription, '')) > 200 OR LENGTH(COALESCE(v_interaction_record.content, '')) > 500 THEN
                v_this_weight := v_this_weight * 1.5;
            END IF;

            -- Bônus por duração (chamadas/reuniões)
            IF COALESCE(v_interaction_record.duration, 0) > 600 THEN -- > 10 min
                v_this_weight := v_this_weight * 1.2;
            END IF;

            v_quality_score := v_quality_score + v_this_weight;
            v_total_quality_weight := v_total_quality_weight + v_this_weight;
        END;
    END LOOP;

    -- 4. Sentimento com Decaimento Temporal (Últimas interações pesam mais)
    SELECT AVG(sentiment_val * weight) / AVG(weight)
    INTO v_avg_sentiment
    FROM (
        SELECT 
            CASE 
                WHEN sentiment = 'positive' THEN 100 
                WHEN sentiment = 'negative' THEN 0 
                ELSE 50 
            END as sentiment_val,
            EXP(-0.1 * EXTRACT(DAY FROM (now() - created_at))) as weight -- Decaimento exponencial
        FROM public.interactions
        WHERE contact_id = v_contact_id
        ORDER BY created_at DESC
        LIMIT 20
    ) as weighted_sentiment;

    IF v_avg_sentiment > 70 THEN v_sentiment := 'positive';
    ELSIF v_avg_sentiment < 30 THEN v_sentiment := 'negative';
    ELSE v_sentiment := 'neutral';
    END IF;

    -- 5. Montagem do Score Final (0-100)
    -- Componente A: Volume e Qualidade (40 pts)
    v_score := LEAST(v_quality_score * 5, 40);
    
    -- Componente B: Sentimento (30 pts)
    v_score := v_score + (COALESCE(v_avg_sentiment, 50) * 0.3);
    
    -- Componente C: Recência (30 pts)
    IF v_days_since_last IS NULL THEN
        v_score := v_score + 0;
    ELSIF v_days_since_last <= 3 THEN v_score := v_score + 30;
    ELSIF v_days_since_last <= 10 THEN v_score := v_score + 20;
    ELSIF v_days_since_last <= 20 THEN v_score := v_score + 10;
    ELSIF v_days_since_last <= 45 THEN v_score := v_score + 5;
    ELSE v_score := v_score + 0;
    END IF;

    -- 6. Atualização Automática de Estágio (Apenas para Risco)
    IF v_days_since_last > 60 AND v_stage NOT IN ('lost', 'unknown') THEN
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
