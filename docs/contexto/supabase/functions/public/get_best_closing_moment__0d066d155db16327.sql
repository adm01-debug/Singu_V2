CREATE OR REPLACE FUNCTION public.get_best_closing_moment(p_contact_id uuid)
 RETURNS TABLE(contact_id uuid, recommended_timing character varying, timing_score integer, emotional_readiness integer, engagement_level integer, risk_of_losing character varying, opportunity_window_start timestamp with time zone, opportunity_window_end timestamp with time zone, recommended_approach text, key_talking_points text[])
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_timing VARCHAR(50) := 'wait';
    v_timing_score INTEGER := 50;
    v_emotional_readiness INTEGER := 50;
    v_engagement INTEGER := 50;
    v_risk VARCHAR(20) := 'medium';
    v_window_start TIMESTAMPTZ;
    v_window_end TIMESTAMPTZ;
    v_approach TEXT;
    v_talking_points TEXT[] := ARRAY[]::TEXT[];
    v_days_since_contact INTEGER;
    v_recent_sentiment VARCHAR(20);
    v_interaction_trend VARCHAR(20);
    v_relationship_score INTEGER;
    v_objections_count INTEGER;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
    -- 1. Dias desde último contato
    SELECT EXTRACT(DAY FROM NOW() - MAX(i.created_at))::INTEGER
    INTO v_days_since_contact
    FROM interactions i WHERE i.contact_id = p_contact_id;
    
    -- 2. Sentimento recente
    SELECT sentiment INTO v_recent_sentiment
    FROM interactions i WHERE i.contact_id = p_contact_id
    ORDER BY created_at DESC LIMIT 1;
    
    -- 3. Relationship score
    SELECT COALESCE(relationship_score, 50) INTO v_relationship_score
    FROM contacts WHERE id = p_contact_id;
    
    -- 4. Objeções não resolvidas
    SELECT COUNT(*) INTO v_objections_count
    FROM objections o WHERE o.contact_id = p_contact_id AND o.is_resolved IS NOT TRUE;
    
    -- 5. Prontidão emocional
    v_emotional_readiness := CASE 
        WHEN v_recent_sentiment = 'positive' THEN 80
        WHEN v_recent_sentiment = 'neutral' THEN 50
        WHEN v_recent_sentiment = 'negative' THEN 20
        ELSE 50
    END;
    
    -- Ajustar com tendência
    SELECT trend_direction INTO v_interaction_trend
    FROM emotional_trend_snapshots ets
    WHERE ets.contact_id = p_contact_id ORDER BY ets.period_end DESC LIMIT 1;
    
    IF v_interaction_trend = 'improving' THEN
        v_emotional_readiness := LEAST(v_emotional_readiness + 15, 100);
    ELSIF v_interaction_trend = 'declining' THEN
        v_emotional_readiness := GREATEST(v_emotional_readiness - 20, 0);
    END IF;
    
    -- 6. Engajamento
    SELECT CASE 
            WHEN COUNT(*) >= 10 THEN 90
            WHEN COUNT(*) >= 5 THEN 70
            WHEN COUNT(*) >= 3 THEN 50
            ELSE 30
        END INTO v_engagement
    FROM interactions i
    WHERE i.contact_id = p_contact_id AND i.created_at > NOW() - INTERVAL '30 days';
    
    -- 7. Timing score
    v_timing_score := (
        v_emotional_readiness * 0.35 +
        v_engagement * 0.25 +
        v_relationship_score * 0.25 +
        (100 - LEAST(COALESCE(v_objections_count, 0) * 15, 50)) * 0.15
    )::INTEGER;
    
    -- 8. Timing recomendado
    v_timing := CASE 
        WHEN v_timing_score >= 80 AND COALESCE(v_objections_count, 0) = 0 THEN 'now'
        WHEN v_timing_score >= 65 THEN 'soon'
        WHEN v_timing_score >= 45 THEN 'wait'
        ELSE 'not_ready'
    END;
    
    -- 9. Risco
    v_risk := CASE 
        WHEN COALESCE(v_days_since_contact, 999) > 30 OR v_interaction_trend = 'declining' THEN 'high'
        WHEN COALESCE(v_days_since_contact, 999) > 14 OR v_emotional_readiness < 40 THEN 'medium'
        ELSE 'low'
    END;
    
    -- 10. Janela de oportunidade
    IF v_timing IN ('now', 'soon') THEN
        v_window_start := NOW();
        v_window_end := NOW() + INTERVAL '7 days';
    ELSE
        v_window_start := NOW() + INTERVAL '7 days';
        v_window_end := NOW() + INTERVAL '21 days';
    END IF;
    
    -- 11. Abordagem
    v_approach := CASE v_timing
        WHEN 'now' THEN 'Contato direto para fechamento. Cliente demonstra sinais positivos.'
        WHEN 'soon' THEN 'Preparar terreno com conteúdo de valor, propor fechamento em 3-5 dias.'
        WHEN 'wait' THEN 'Focar em construir relacionamento e resolver objeções.'
        ELSE 'Cliente não está pronto. Investir em nurturing.'
    END;
    
    -- 12. Talking points
    v_talking_points := CASE v_timing
        WHEN 'now' THEN ARRAY['Reforçar benefícios', 'Condição especial com prazo', 'Prova social']
        WHEN 'soon' THEN ARRAY['Case de sucesso', 'Timeline de decisão', 'Demonstração/trial']
        ELSE ARRAY['Entender necessidades', 'Identificar objeções', 'Mapear stakeholders']
    END;
    
    -- 13. Salvar análise
    UPDATE closing_moment_analysis SET is_current = false 
    WHERE closing_moment_analysis.contact_id = p_contact_id;
    
    INSERT INTO closing_moment_analysis (
        contact_id, recommended_timing, timing_score,
        emotional_readiness, engagement_level, risk_of_losing,
        opportunity_window_start, opportunity_window_end,
        recommended_approach, key_talking_points
    ) VALUES (
        p_contact_id, v_timing, v_timing_score,
        v_emotional_readiness, v_engagement, v_risk,
        v_window_start, v_window_end, v_approach, v_talking_points
    );
    
    RETURN QUERY SELECT 
        p_contact_id, v_timing, v_timing_score,
        v_emotional_readiness, v_engagement, v_risk,
        v_window_start, v_window_end, v_approach, v_talking_points;
END;
$function$
