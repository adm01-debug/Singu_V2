CREATE OR REPLACE FUNCTION public.calculate_eq_score(p_contact_id uuid)
 RETURNS TABLE(contact_id uuid, eq_score integer, eq_level character varying, self_awareness integer, self_management integer, social_awareness integer, relationship_management integer, communication_style character varying, sales_implications text[])
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_eq_score INTEGER := 50;
    v_eq_level VARCHAR(20);
    v_self_awareness INTEGER := 50;
    v_self_management INTEGER := 50;
    v_social_awareness INTEGER := 50;
    v_relationship_mgmt INTEGER := 50;
    v_comm_style VARCHAR(50);
    v_implications TEXT[] := ARRAY[]::TEXT[];
    v_confidence DECIMAL(5,2) := 50;
    v_data_points INTEGER := 0;
    v_positive_ratio DECIMAL(5,2);
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
    -- 1. AUTOCONSCIÊNCIA - consistência de comunicação
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 50
            ELSE LEAST(100, 50 + (COUNT(DISTINCT sentiment) * 10))
        END,
        COUNT(*)
    INTO v_self_awareness, v_data_points
    FROM interactions i
    WHERE i.contact_id = p_contact_id
    AND i.created_at > NOW() - INTERVAL '90 days';
    
    -- 2. AUTOGESTÃO - estabilidade emocional
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 50
            WHEN STDDEV(
                CASE sentiment WHEN 'positive' THEN 80 WHEN 'neutral' THEN 50 WHEN 'negative' THEN 20 ELSE 50 END
            ) IS NULL THEN 70
            ELSE GREATEST(20, 100 - STDDEV(
                CASE sentiment WHEN 'positive' THEN 80 WHEN 'neutral' THEN 50 WHEN 'negative' THEN 20 ELSE 50 END
            )::INTEGER)
        END
    INTO v_self_management
    FROM interactions i
    WHERE i.contact_id = p_contact_id
    AND i.created_at > NOW() - INTERVAL '90 days';
    
    -- 3. CONSCIÊNCIA SOCIAL - engajamento positivo
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 50
            ELSE LEAST(100, 40 + (
                COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)::DECIMAL / GREATEST(COUNT(*), 1) * 60
            )::INTEGER)
        END
    INTO v_social_awareness
    FROM interactions i
    WHERE i.contact_id = p_contact_id
    AND i.created_at > NOW() - INTERVAL '90 days';
    
    -- 4. GESTÃO DE RELACIONAMENTOS - longevidade e frequência
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 50
            ELSE LEAST(100, 30 + (
                LEAST(EXTRACT(DAY FROM NOW() - MIN(created_at)) / 30, 20) +
                LEAST(COUNT(*) * 2, 30) +
                (COUNT(CASE WHEN sentiment = 'positive' THEN 1 END)::DECIMAL / GREATEST(COUNT(*), 1) * 20)
            )::INTEGER)
        END
    INTO v_relationship_mgmt
    FROM interactions i
    WHERE i.contact_id = p_contact_id;
    
    -- 5. Calcular EQ Score geral
    v_eq_score := (
        v_self_awareness * 0.25 +
        v_self_management * 0.25 +
        v_social_awareness * 0.25 +
        v_relationship_mgmt * 0.25
    )::INTEGER;
    
    -- 6. Determinar nível de EQ
    v_eq_level := CASE 
        WHEN v_eq_score >= 85 THEN 'very_high'
        WHEN v_eq_score >= 70 THEN 'high'
        WHEN v_eq_score >= 50 THEN 'average'
        WHEN v_eq_score >= 35 THEN 'low'
        ELSE 'very_low'
    END;
    
    -- 7. Determinar estilo de comunicação
    v_comm_style := CASE 
        WHEN v_self_awareness >= 70 AND v_self_management >= 70 THEN 'analytical'
        WHEN v_social_awareness >= 70 AND v_relationship_mgmt >= 70 THEN 'amiable'
        WHEN v_self_management >= 70 AND v_relationship_mgmt < 60 THEN 'driver'
        ELSE 'expressive'
    END;
    
    -- 8. Gerar implicações para vendas
    IF v_eq_score >= 70 THEN
        v_implications := array_append(v_implications, 'Cliente com alta EQ - abordagem direta funciona bem');
        v_implications := array_append(v_implications, 'Valoriza relacionamentos autênticos');
    ELSE
        v_implications := array_append(v_implications, 'Adaptar comunicação - ser mais paciente e claro');
    END IF;
    
    IF v_self_management < 50 THEN
        v_implications := array_append(v_implications, 'CUIDADO: Pode reagir emocionalmente - evitar pressão');
    END IF;
    
    IF v_social_awareness >= 70 THEN
        v_implications := array_append(v_implications, 'Cliente perceptivo - seja genuíno e transparente');
    END IF;
    
    v_confidence := LEAST(50 + (v_data_points * 5), 95);
    
    -- 9. Salvar resultado
    UPDATE contact_eq_scores SET is_current = false 
    WHERE contact_eq_scores.contact_id = p_contact_id;
    
    INSERT INTO contact_eq_scores (
        contact_id, eq_score, eq_level,
        self_awareness_score, self_management_score,
        social_awareness_score, relationship_management_score,
        communication_style, sales_implications,
        confidence_level, data_points_count
    ) VALUES (
        p_contact_id, v_eq_score, v_eq_level,
        v_self_awareness, v_self_management,
        v_social_awareness, v_relationship_mgmt,
        v_comm_style, v_implications,
        v_confidence, v_data_points
    );
    
    RETURN QUERY SELECT 
        p_contact_id, v_eq_score, v_eq_level,
        v_self_awareness, v_self_management,
        v_social_awareness, v_relationship_mgmt,
        v_comm_style, v_implications;
END;
$function$
