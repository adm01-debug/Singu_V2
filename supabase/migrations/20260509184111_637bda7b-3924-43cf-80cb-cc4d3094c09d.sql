-- 1. Additional Constraints for Cross-Validation
-- Ensure MBTI Type matches the scores (e.g., if E score > 50, type must have E)
CREATE OR REPLACE FUNCTION public.check_mbti_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check if both type and relevant scores are present
    IF NEW.mbti_type IS NOT NULL THEN
        IF NEW.mbti_e_i_score IS NOT NULL AND 
           ((NEW.mbti_type LIKE 'E%' AND NEW.mbti_e_i_score < 50) OR (NEW.mbti_type LIKE 'I%' AND NEW.mbti_e_i_score > 50)) THEN
            RAISE EXCEPTION 'MBTI Type % inconsistent with E/I score %', NEW.mbti_type, NEW.mbti_e_i_score;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_mbti_consistency ON public.contact_personality;
CREATE TRIGGER tr_check_mbti_consistency 
BEFORE INSERT OR UPDATE ON public.contact_personality
FOR EACH ROW EXECUTE FUNCTION public.check_mbti_consistency();

-- 2. Update Audit View to be more inclusive
CREATE OR REPLACE VIEW public.v_contact_personality_audit AS
SELECT 
    l.id,
    l.contact_id,
    l.created_at as timestamp,
    u.email as user_email,
    l.change_source,
    l.field_name,
    l.old_value,
    l.new_value,
    l.reason
FROM public.crm_relationship_audit_logs l
LEFT JOIN auth.users u ON l.user_id = u.id
WHERE l.reason LIKE '%Atualização de perfil comportamental%'
   OR l.field_name IN (
       'big_five_openness', 'big_five_confidence', 
       'mbti_type', 'mbti_e_i_score', 
       'enneagram_type', 'enneagram_wing',
       'temperament_primary'
   )
ORDER BY l.created_at DESC;

-- 3. Enhance Gap Detection with specific Framework rules
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
    WHERE contact_id = p_contact_id AND enneagram_type IS NOT NULL AND enneagram_wing IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;
