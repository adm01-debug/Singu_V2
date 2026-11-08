CREATE OR REPLACE FUNCTION public.calculate_emotional_trend(p_contact_id uuid, p_period_days integer DEFAULT 30)
 RETURNS TABLE(contact_id uuid, trend_direction character varying, trend_strength numeric, avg_sentiment numeric, dominant_emotion character varying, positive_count integer, negative_count integer, patterns text[], recommendations text[])
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_trend_direction VARCHAR(20) := 'stable';
    v_trend_strength DECIMAL(5,2) := 0;
    v_avg_sentiment DECIMAL(5,2) := 0;
    v_dominant_emotion VARCHAR(50) := 'neutral';
    v_positive INTEGER := 0;
    v_neutral INTEGER := 0;
    v_negative INTEGER := 0;
    v_total INTEGER := 0;
    v_patterns TEXT[] := ARRAY[]::TEXT[];
    v_recommendations TEXT[] := ARRAY[]::TEXT[];
    v_prev_avg DECIMAL(5,2);
    v_emotion_dist JSONB;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
    -- 1. Contar interações por sentimento
    SELECT 
        COUNT(CASE WHEN sentiment = 'positive' THEN 1 END),
        COUNT(CASE WHEN sentiment = 'neutral' OR sentiment IS NULL THEN 1 END),
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END),
        COUNT(*)
    INTO v_positive, v_neutral, v_negative, v_total
    FROM interactions i
    WHERE i.contact_id = p_contact_id
    AND i.created_at > NOW() - (p_period_days || ' days')::INTERVAL;
    
    -- 2. Calcular sentimento médio
    IF v_total > 0 THEN
        v_avg_sentiment := ((v_positive * 100) + (v_neutral * 0) + (v_negative * -100))::DECIMAL / v_total;
    END IF;
    
    -- 3. Calcular sentimento do período anterior
    SELECT 
        CASE WHEN COUNT(*) = 0 THEN 0
        ELSE ((COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) * 100) + 
              (COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) * -100))::DECIMAL / COUNT(*)
        END
    INTO v_prev_avg
    FROM interactions i
    WHERE i.contact_id = p_contact_id
    AND i.created_at BETWEEN 
        NOW() - (p_period_days * 2 || ' days')::INTERVAL 
        AND NOW() - (p_period_days || ' days')::INTERVAL;
    
    -- 4. Determinar tendência
    IF v_avg_sentiment > v_prev_avg + 10 THEN
        v_trend_direction := 'improving';
        v_trend_strength := LEAST(ABS(v_avg_sentiment - v_prev_avg), 100);
    ELSIF v_avg_sentiment < v_prev_avg - 10 THEN
        v_trend_direction := 'declining';
        v_trend_strength := LEAST(ABS(v_avg_sentiment - v_prev_avg), 100);
    ELSE
        v_trend_direction := 'stable';
        v_trend_strength := LEAST(ABS(v_avg_sentiment - COALESCE(v_prev_avg, 0)), 100);
    END IF;
    
    -- 5. Determinar emoção dominante
    v_dominant_emotion := CASE 
        WHEN v_positive > v_negative AND v_positive > v_neutral THEN 'positive'
        WHEN v_negative > v_positive AND v_negative > v_neutral THEN 'negative'
        ELSE 'neutral'
    END;
    
    -- 6. Identificar padrões
    IF v_negative > v_positive THEN
        v_patterns := array_append(v_patterns, 'Predominância de interações negativas');
    END IF;
    IF v_total < 3 THEN
        v_patterns := array_append(v_patterns, 'Poucas interações - dados limitados');
    END IF;
    IF v_trend_direction = 'declining' AND v_trend_strength > 30 THEN
        v_patterns := array_append(v_patterns, 'Declínio acentuado no sentimento');
    END IF;
    
    -- 7. Gerar recomendações
    IF v_trend_direction = 'declining' THEN
        v_recommendations := array_append(v_recommendations, 'Identificar causa do declínio');
        v_recommendations := array_append(v_recommendations, 'Agendar conversa para entender insatisfações');
    END IF;
    IF v_negative > v_positive THEN
        v_recommendations := array_append(v_recommendations, 'Priorizar resolução de problemas pendentes');
    END IF;
    IF v_trend_direction = 'improving' THEN
        v_recommendations := array_append(v_recommendations, 'Momento favorável - considerar avançar negociação');
    END IF;
    IF array_length(v_recommendations, 1) IS NULL THEN
        v_recommendations := ARRAY['Manter acompanhamento regular'];
    END IF;
    
    -- 8. Montar distribuição
    v_emotion_dist := jsonb_build_object(
        'positive', ROUND(v_positive::DECIMAL / GREATEST(v_total, 1) * 100),
        'neutral', ROUND(v_neutral::DECIMAL / GREATEST(v_total, 1) * 100),
        'negative', ROUND(v_negative::DECIMAL / GREATEST(v_total, 1) * 100)
    );
    
    -- 9. Salvar snapshot
    INSERT INTO emotional_trend_snapshots (
        contact_id, period_start, period_end, period_type,
        avg_sentiment_score, dominant_emotion, emotion_distribution,
        trend_direction, trend_strength,
        total_interactions, positive_interactions, neutral_interactions, negative_interactions,
        patterns_identified, recommended_actions
    ) VALUES (
        p_contact_id, 
        NOW() - (p_period_days || ' days')::INTERVAL, NOW(),
        CASE WHEN p_period_days <= 7 THEN 'weekly' WHEN p_period_days <= 30 THEN 'monthly' ELSE 'custom' END,
        v_avg_sentiment, v_dominant_emotion, v_emotion_dist,
        v_trend_direction, v_trend_strength,
        v_total, v_positive, v_neutral, v_negative,
        v_patterns, v_recommendations
    );
    
    RETURN QUERY SELECT 
        p_contact_id, v_trend_direction, v_trend_strength,
        v_avg_sentiment, v_dominant_emotion,
        v_positive, v_negative, v_patterns, v_recommendations;
END;
$function$
