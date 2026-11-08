CREATE OR REPLACE FUNCTION public.predict_churn(p_contact_id uuid)
 RETURNS TABLE(contact_id uuid, churn_probability numeric, risk_level character varying, risk_factors jsonb, recommended_actions text[], confidence_level numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_churn_prob DECIMAL(5,2) := 0;
    v_risk_level VARCHAR(20);
    v_risk_factors JSONB := '{}';
    v_actions TEXT[] := ARRAY[]::TEXT[];
    v_confidence DECIMAL(5,2) := 50;
    
    v_days_since_contact INTEGER;
    v_interaction_count INTEGER;
    v_avg_sentiment DECIMAL(5,2);
    v_relationship_score INTEGER;
    v_recency_risk DECIMAL(5,2) := 0;
    v_frequency_risk DECIMAL(5,2) := 0;
    v_sentiment_risk DECIMAL(5,2) := 0;
    v_engagement_risk DECIMAL(5,2) := 0;
    v_company_id UUID;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
    -- 1. Calcular dias sem contato
    SELECT EXTRACT(DAY FROM NOW() - MAX(i.created_at))::INTEGER
    INTO v_days_since_contact
    FROM interactions i
    WHERE i.contact_id = p_contact_id;
    
    v_recency_risk := CASE 
        WHEN v_days_since_contact IS NULL THEN 90
        WHEN v_days_since_contact > 90 THEN 90
        WHEN v_days_since_contact > 60 THEN 70
        WHEN v_days_since_contact > 30 THEN 50
        WHEN v_days_since_contact > 14 THEN 30
        ELSE 10
    END;
    
    -- 2. Calcular frequência de interações
    SELECT COUNT(*)
    INTO v_interaction_count
    FROM interactions i
    WHERE i.contact_id = p_contact_id
        AND i.created_at > NOW() - INTERVAL '90 days';
    
    v_frequency_risk := CASE 
        WHEN v_interaction_count = 0 THEN 90
        WHEN v_interaction_count < 3 THEN 70
        WHEN v_interaction_count < 6 THEN 50
        WHEN v_interaction_count < 10 THEN 30
        ELSE 10
    END;
    
    -- 3. Calcular sentimento médio
    SELECT AVG(
        CASE 
            WHEN i.sentiment = 'positive' THEN 10
            WHEN i.sentiment = 'neutral' THEN 50
            WHEN i.sentiment = 'negative' THEN 90
            ELSE 50
        END
    )::DECIMAL(5,2)
    INTO v_avg_sentiment
    FROM interactions i
    WHERE i.contact_id = p_contact_id
        AND i.created_at > NOW() - INTERVAL '90 days';
    
    v_sentiment_risk := COALESCE(v_avg_sentiment, 50);
    
    -- 4. Pegar relationship score e company_id
    SELECT COALESCE(c.relationship_score, 50), c.company_id
    INTO v_relationship_score, v_company_id
    FROM contacts c
    WHERE c.id = p_contact_id;
    
    v_engagement_risk := 100 - COALESCE(v_relationship_score, 50);
    
    -- 5. Calcular probabilidade de churn
    v_churn_prob := (
        v_recency_risk * 0.30 +
        v_frequency_risk * 0.25 +
        v_sentiment_risk * 0.25 +
        v_engagement_risk * 0.20
    );
    
    -- 6. Determinar nível de risco
    v_risk_level := CASE 
        WHEN v_churn_prob >= 80 THEN 'critical'
        WHEN v_churn_prob >= 60 THEN 'high'
        WHEN v_churn_prob >= 40 THEN 'medium'
        ELSE 'low'
    END;
    
    -- 7. Montar fatores de risco
    v_risk_factors := jsonb_build_object(
        'recency', jsonb_build_object('score', v_recency_risk, 'days_since_contact', v_days_since_contact),
        'frequency', jsonb_build_object('score', v_frequency_risk, 'interactions_90d', v_interaction_count),
        'sentiment', jsonb_build_object('score', v_sentiment_risk, 'avg_sentiment', v_avg_sentiment),
        'engagement', jsonb_build_object('score', v_engagement_risk, 'relationship_score', v_relationship_score)
    );
    
    -- 8. Definir ações recomendadas
    IF v_recency_risk >= 70 THEN
        v_actions := array_append(v_actions, 'Fazer contato imediato - cliente sem interação há muito tempo');
    END IF;
    
    IF v_frequency_risk >= 70 THEN
        v_actions := array_append(v_actions, 'Aumentar frequência de touchpoints');
    END IF;
    
    IF v_sentiment_risk >= 70 THEN
        v_actions := array_append(v_actions, 'Identificar e resolver insatisfações');
    END IF;
    
    IF v_engagement_risk >= 70 THEN
        v_actions := array_append(v_actions, 'Reengajar com conteúdo ou oferta especial');
    END IF;
    
    IF array_length(v_actions, 1) IS NULL THEN
        v_actions := ARRAY['Manter relacionamento ativo com contatos periódicos'];
    END IF;
    
    -- 9. Calcular confiança
    v_confidence := LEAST(50 + (v_interaction_count * 5), 95);
    
    -- 10. Salvar previsão (QUALIFICANDO nome da tabela)
    UPDATE churn_predictions SET is_current = false 
    WHERE churn_predictions.contact_id = p_contact_id;
    
    INSERT INTO churn_predictions (
        contact_id, company_id, churn_probability, confidence_level, 
        risk_level, recency_factor, frequency_factor, engagement_factor,
        sentiment_factor, risk_factors, recommended_actions
    )
    VALUES (
        p_contact_id, v_company_id, v_churn_prob, v_confidence,
        v_risk_level, v_recency_risk, v_frequency_risk, v_engagement_risk,
        v_sentiment_risk, v_risk_factors, v_actions
    );
    
    RETURN QUERY SELECT 
        p_contact_id,
        v_churn_prob,
        v_risk_level,
        v_risk_factors,
        v_actions,
        v_confidence;
END;
$function$
