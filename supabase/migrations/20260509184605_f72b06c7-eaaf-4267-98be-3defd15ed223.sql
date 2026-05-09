-- Enhance Gap Detection with Rapport rules
CREATE OR REPLACE FUNCTION public.get_contact_framework_gaps(p_contact_id UUID)
RETURNS TABLE (
    category TEXT,
    field_name TEXT,
    issue_type TEXT,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY 
    -- Big Five incomplete
    SELECT 'Frameworks'::TEXT, 'Big Five'::TEXT, 'Dados Incompletos'::TEXT, 'Média'::TEXT
    FROM public.contact_personality 
    WHERE contact_id = p_contact_id AND (big_five_openness IS NULL OR big_five_conscientiousness IS NULL OR big_five_extraversion IS NULL OR big_five_agreeableness IS NULL OR big_five_neuroticism IS NULL)
    
    UNION ALL
    -- MBTI missing scores
    SELECT 'Frameworks'::TEXT, 'MBTI Scores'::TEXT, 'Scores Dimensionais Ausentes'::TEXT, 'Média'::TEXT
    FROM public.contact_personality 
    WHERE contact_id = p_contact_id AND mbti_type IS NOT NULL AND (mbti_e_i_score IS NULL OR mbti_s_n_score IS NULL)

    UNION ALL
    -- Enneagram missing wing
    SELECT 'Frameworks'::TEXT, 'Eneagrama'::TEXT, 'Asa não definida'::TEXT, 'Baixa'::TEXT
    FROM public.contact_personality 
    WHERE contact_id = p_contact_id AND enneagram_type IS NOT NULL AND enneagram_wing IS NULL
    
    UNION ALL
    -- Rapport Gaps
    SELECT 'Rapport'::TEXT, 'Canais Sensoriais'::TEXT, 'VAKD não mapeado'::TEXT, 'Média'::TEXT
    WHERE NOT EXISTS (SELECT 1 FROM public.contact_rapport_strategy WHERE contact_id = p_contact_id AND (visual_preference_score IS NOT NULL OR auditory_preference_score IS NOT NULL))
    
    UNION ALL
    -- NLP Gaps
    SELECT 'NLP'::TEXT, 'Ancoragem'::TEXT, 'Sem âncoras emocionais'::TEXT, 'Baixa'::TEXT
    FROM public.contact_rapport_strategy 
    WHERE contact_id = p_contact_id AND (emotional_anchors IS NULL OR array_length(emotional_anchors, 1) = 0);
END;
$$ LANGUAGE plpgsql STABLE;
