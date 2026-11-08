CREATE OR REPLACE FUNCTION public.calculate_closing_score(p_contact_id uuid)
 RETURNS TABLE(contact_id uuid, score integer, components jsonb, temperature character varying, recommended_action text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_score INTEGER := 0;
    v_components JSONB := '{}';
    v_engagement_score INTEGER := 50;
    v_recency_score INTEGER := 0;
    v_frequency_score INTEGER := 0;
    v_relationship_score INTEGER := 50;
    v_profile_completeness INTEGER := 0;
    v_days_since_contact INTEGER;
    v_interaction_count INTEGER;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
    -- 1. Recência
    SELECT EXTRACT(DAY FROM NOW() - MAX(i.created_at))::INTEGER
    INTO v_days_since_contact
    FROM interactions i WHERE i.contact_id = p_contact_id;
    
    v_recency_score := CASE 
        WHEN v_days_since_contact IS NULL THEN 0
        WHEN v_days_since_contact <= 7 THEN 100
        WHEN v_days_since_contact <= 14 THEN 80
        WHEN v_days_since_contact <= 30 THEN 60
        WHEN v_days_since_contact <= 60 THEN 40
        WHEN v_days_since_contact <= 90 THEN 20
        ELSE 0
    END;
    
    -- 2. Frequência
    SELECT COUNT(*) INTO v_interaction_count
    FROM interactions i
    WHERE i.contact_id = p_contact_id AND i.created_at > NOW() - INTERVAL '30 days';
    
    v_frequency_score := LEAST(COALESCE(v_interaction_count, 0) * 10, 100);
    
    -- 3. Engajamento
    SELECT COALESCE(AVG(
        CASE WHEN i.sentiment = 'positive' THEN 100 WHEN i.sentiment = 'neutral' THEN 50 ELSE 20 END
    ), 50)::INTEGER INTO v_engagement_score
    FROM interactions i
    WHERE i.contact_id = p_contact_id AND i.created_at > NOW() - INTERVAL '90 days';
    
    -- 4. Relationship score
    SELECT COALESCE(c.relationship_score, 50) INTO v_relationship_score
    FROM contacts c WHERE c.id = p_contact_id;
    
    -- 5. Completude do perfil
    SELECT (
        (CASE WHEN EXISTS (SELECT 1 FROM disc_assessments da WHERE da.contact_id = p_contact_id) THEN 20 ELSE 0 END) +
        (CASE WHEN EXISTS (SELECT 1 FROM vak_profiles vp WHERE vp.contact_id = p_contact_id) THEN 20 ELSE 0 END) +
        (CASE WHEN EXISTS (SELECT 1 FROM contact_metaprograms cm WHERE cm.contact_id = p_contact_id) THEN 20 ELSE 0 END) +
        (CASE WHEN EXISTS (SELECT 1 FROM contact_values cv WHERE cv.contact_id = p_contact_id) THEN 20 ELSE 0 END) +
        (CASE WHEN EXISTS (SELECT 1 FROM communication_preferences cp WHERE cp.contact_id = p_contact_id) THEN 20 ELSE 0 END)
    ) INTO v_profile_completeness;
    
    -- 6. Score final
    v_score := (
        COALESCE(v_recency_score, 0) * 0.25 +
        COALESCE(v_frequency_score, 0) * 0.20 +
        COALESCE(v_engagement_score, 50) * 0.25 +
        COALESCE(v_relationship_score, 50) * 0.20 +
        COALESCE(v_profile_completeness, 0) * 0.10
    )::INTEGER;
    
    v_components := jsonb_build_object(
        'recency', v_recency_score, 'frequency', v_frequency_score,
        'engagement', v_engagement_score, 'relationship', v_relationship_score,
        'profile_completeness', v_profile_completeness,
        'days_since_contact', v_days_since_contact, 'interactions_30d', v_interaction_count
    );
    
    -- 7. Atualizar contato (QUALIFICANDO)
    UPDATE contacts SET relationship_score = v_score 
    WHERE contacts.id = p_contact_id;
    
    -- 8. Registrar histórico
    BEGIN
        INSERT INTO relationship_score_history (contact_id, score, previous_score, measured_at)
        VALUES (p_contact_id, v_score, v_relationship_score, NOW());
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    RETURN QUERY SELECT 
        p_contact_id, v_score, v_components,
        CASE WHEN v_score >= 80 THEN 'HOT 🔥' WHEN v_score >= 60 THEN 'WARM 🌡️' WHEN v_score >= 40 THEN 'COOL 💨' ELSE 'COLD ❄️' END::VARCHAR(20),
        CASE WHEN v_score >= 80 THEN 'Pronto para fechar!' WHEN v_score >= 60 THEN 'Intensificar relacionamento' WHEN v_score >= 40 THEN 'Enviar conteúdo relevante' ELSE 'Campanha de reativação' END::TEXT;
END;
$function$
