-- 1. Improved Consistency Checks for Behavioral Data
-- First check if constraints exist to avoid errors
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'disc_confidence_range') THEN
        ALTER TABLE public.contact_behavior ADD CONSTRAINT disc_confidence_range CHECK (disc_confidence >= 0 AND disc_confidence <= 100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'formality_level_range') THEN
        ALTER TABLE public.contact_behavior ADD CONSTRAINT formality_level_range CHECK (formality_level >= 1 AND formality_level <= 5);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decision_power_range') THEN
        ALTER TABLE public.contact_influence ADD CONSTRAINT decision_power_range CHECK (decision_power >= 1 AND decision_power <= 10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_level_range') THEN
        ALTER TABLE public.contact_influence ADD CONSTRAINT support_level_range CHECK (support_level >= 1 AND support_level <= 10);
    END IF;
END $$;

-- 2. Behavioral Consistency Logic
CREATE OR REPLACE FUNCTION public.validate_behavioral_consistency(p_contact_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_issues TEXT[] := '{}';
    v_behavior RECORD;
    v_influence RECORD;
BEGIN
    SELECT * INTO v_behavior FROM public.contact_behavior WHERE contact_id = p_contact_id;
    SELECT * INTO v_influence FROM public.contact_influence WHERE contact_id = p_contact_id;

    IF v_behavior.id IS NOT NULL THEN
        IF v_behavior.disc_primary IS NOT NULL AND (v_behavior.disc_confidence IS NULL OR v_behavior.disc_confidence = 0) THEN
            v_issues := array_append(v_issues, 'Perfil DISC definido mas confiança é zero ou nula');
        END IF;
    END IF;

    IF v_influence.id IS NOT NULL THEN
        IF v_influence.decision_power > 8 AND (v_influence.support_level IS NULL) THEN
            v_issues := array_append(v_issues, 'Alto poder de decisão mas nível de suporte não mapeado');
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'contact_id', p_contact_id,
        'is_consistent', array_length(v_issues, 1) IS NULL,
        'issues', v_issues,
        'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Audit View (Adjusted to real table structure)
CREATE OR REPLACE VIEW public.v_contact_behavior_audit AS
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
   OR l.field_name IN ('disc_primary', 'vak_primary', 'preferred_channel', 'decision_power', 'support_level')
ORDER BY l.created_at DESC;

-- 4. Gap Detection Function
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
    FROM public.contact_influence WHERE contact_id = p_contact_id AND decision_power IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;
