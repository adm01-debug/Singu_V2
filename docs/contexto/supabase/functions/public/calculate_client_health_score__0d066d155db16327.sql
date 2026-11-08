CREATE OR REPLACE FUNCTION public.calculate_client_health_score(p_contact_id uuid)
 RETURNS TABLE(contact_id uuid, health_score integer, health_status character varying, components jsonb, risk_alerts text[], opportunities text[])
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_health INTEGER := 0;
    v_status VARCHAR(20);
    v_components JSONB := '{}';
    v_alerts TEXT[] := ARRAY[]::TEXT[];
    v_opportunities TEXT[] := ARRAY[]::TEXT[];
    
    v_engagement_score INTEGER := 50;
    v_satisfaction_score INTEGER := 50;
    v_recency_score INTEGER := 50;
    v_growth_score INTEGER := 50;
    
    v_days_since_contact INTEGER;
    v_last_satisfaction INTEGER;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
    -- 1. Score de Engajamento
    SELECT 
        LEAST(COUNT(*) * 10, 100)::INTEGER,
        EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER
    INTO v_engagement_score, v_days_since_contact
    FROM interactions i
    WHERE i.contact_id = p_contact_id
        AND i.created_at > NOW() - INTERVAL '30 days';
    
    v_engagement_score := COALESCE(v_engagement_score, 0);
    
    -- 2. Score de Recência
    v_recency_score := CASE 
        WHEN v_days_since_contact IS NULL THEN 20
        WHEN v_days_since_contact <= 7 THEN 100
        WHEN v_days_since_contact <= 14 THEN 80
        WHEN v_days_since_contact <= 30 THEN 60
        WHEN v_days_since_contact <= 60 THEN 40
        ELSE 20
    END;
    
    -- 3. Score de Satisfação
    SELECT COALESCE(overall_score, 50)
    INTO v_last_satisfaction
    FROM satisfaction_scores ss
    WHERE ss.contact_id = p_contact_id
    ORDER BY ss.collected_at DESC
    LIMIT 1;
    
    v_satisfaction_score := COALESCE(v_last_satisfaction, 50);
    
    -- 4. Score de Crescimento
    SELECT 
        CASE 
            WHEN prev_count = 0 THEN 50
            ELSE LEAST(((curr_count - prev_count)::DECIMAL / GREATEST(prev_count, 1) * 100) + 50, 100)
        END::INTEGER
    INTO v_growth_score
    FROM (
        SELECT 
            (SELECT COUNT(*) FROM interactions i WHERE i.contact_id = p_contact_id AND i.created_at > NOW() - INTERVAL '30 days') AS curr_count,
            (SELECT COUNT(*) FROM interactions i WHERE i.contact_id = p_contact_id AND i.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days') AS prev_count
    ) counts;
    
    v_growth_score := COALESCE(v_growth_score, 50);
    
    -- 5. Calcular Health Score final
    v_health := (
        v_engagement_score * 0.30 +
        v_recency_score * 0.25 +
        v_satisfaction_score * 0.30 +
        v_growth_score * 0.15
    )::INTEGER;
    
    -- 6. Determinar status
    v_status := CASE 
        WHEN v_health >= 80 THEN 'excellent'
        WHEN v_health >= 60 THEN 'good'
        WHEN v_health >= 40 THEN 'at_risk'
        ELSE 'critical'
    END;
    
    -- 7. Montar componentes
    v_components := jsonb_build_object(
        'engagement', v_engagement_score,
        'recency', v_recency_score,
        'satisfaction', v_satisfaction_score,
        'growth', v_growth_score,
        'days_since_contact', v_days_since_contact
    );
    
    -- 8. Identificar alertas
    IF v_recency_score < 40 THEN
        v_alerts := array_append(v_alerts, 'Cliente sem contato há muito tempo');
    END IF;
    
    IF v_satisfaction_score < 50 THEN
        v_alerts := array_append(v_alerts, 'Satisfação abaixo da média');
    END IF;
    
    IF v_growth_score < 30 THEN
        v_alerts := array_append(v_alerts, 'Engajamento em queda');
    END IF;
    
    IF array_length(v_alerts, 1) IS NULL THEN
        v_alerts := ARRAY['Nenhum alerta identificado'];
    END IF;
    
    -- 9. Identificar oportunidades
    IF v_satisfaction_score >= 80 THEN
        v_opportunities := array_append(v_opportunities, 'Cliente satisfeito: Solicitar indicação');
    END IF;
    
    IF v_engagement_score >= 80 THEN
        v_opportunities := array_append(v_opportunities, 'Alto engajamento: Oportunidade de upsell');
    END IF;
    
    IF v_growth_score >= 70 THEN
        v_opportunities := array_append(v_opportunities, 'Crescimento positivo: Expandir relacionamento');
    END IF;
    
    IF array_length(v_opportunities, 1) IS NULL THEN
        v_opportunities := ARRAY['Manter acompanhamento regular'];
    END IF;
    
    -- 10. Atualizar score no contato (QUALIFICANDO)
    UPDATE contacts SET relationship_score = v_health 
    WHERE contacts.id = p_contact_id;
    
    RETURN QUERY SELECT 
        p_contact_id,
        v_health,
        v_status,
        v_components,
        v_alerts,
        v_opportunities;
END;
$function$
