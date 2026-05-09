-- Update Gap Detection to include Personality and Metaprograms
CREATE OR REPLACE FUNCTION public.get_contact_behavior_gaps(p_contact_id UUID)
RETURNS TABLE (
    category TEXT,
    field_name TEXT,
    issue_type TEXT,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY 
    -- DISC Gaps
    SELECT 'DISC'::TEXT, 'Perfil Primário'::TEXT, 'Ausente'::TEXT, 'Alta'::TEXT
    FROM public.contact_behavior WHERE contact_id = p_contact_id AND disc_primary IS NULL
    UNION ALL
    SELECT 'DISC'::TEXT, 'Confiança'::TEXT, 'Baixa/Nula'::TEXT, 'Média'::TEXT
    FROM public.contact_behavior WHERE contact_id = p_contact_id AND (disc_confidence IS NULL OR disc_confidence < 20)
    
    -- Communication Gaps
    UNION ALL
    SELECT 'Comunicação'::TEXT, 'Canal Preferido'::TEXT, 'Ausente'::TEXT, 'Média'::TEXT
    FROM public.contact_behavior WHERE contact_id = p_contact_id AND preferred_channel IS NULL
    
    -- Influence Gaps
    UNION ALL
    SELECT 'Influência'::TEXT, 'Poder de Decisão'::TEXT, 'Ausente'::TEXT, 'Alta'::TEXT
    FROM public.contact_influence WHERE contact_id = p_contact_id AND decision_power IS NULL

    -- Personality Frameworks Gaps
    UNION ALL
    SELECT 'Personalidade'::TEXT, 'Big Five'::TEXT, 'Score Incompleto'::TEXT, 'Média'::TEXT
    FROM public.contact_personality WHERE contact_id = p_contact_id AND (big_five_openness IS NULL OR big_five_conscientiousness IS NULL)
    UNION ALL
    SELECT 'Personalidade'::TEXT, 'MBTI'::TEXT, 'Tipo Ausente'::TEXT, 'Alta'::TEXT
    FROM public.contact_personality WHERE contact_id = p_contact_id AND mbti_type IS NULL
    
    -- Metaprograms Gaps
    UNION ALL
    SELECT 'NLP'::TEXT, 'Metaprogramas'::TEXT, 'Não Mapeado'::TEXT, 'Baixa'::TEXT
    WHERE NOT EXISTS (SELECT 1 FROM public.contact_metaprograms WHERE contact_id = p_contact_id);
END;
$$ LANGUAGE plpgsql STABLE;
