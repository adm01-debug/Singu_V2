-- View for easy access to NLP profiles with calculated fields
CREATE OR REPLACE VIEW public.vw_contacts_nlp AS
WITH latest_vak AS (
    SELECT DISTINCT ON (contact_id) 
        contact_id,
        visual_score,
        auditory_score,
        kinesthetic_score,
        digital_score,
        created_at,
        CASE 
            WHEN visual_score >= GREATEST(auditory_score, kinesthetic_score, digital_score) THEN 'V'
            WHEN auditory_score >= GREATEST(visual_score, kinesthetic_score, digital_score) THEN 'A'
            WHEN kinesthetic_score >= GREATEST(visual_score, auditory_score, digital_score) THEN 'K'
            ELSE 'D'
        END as vak_dominant
    FROM public.vak_analysis_history
    ORDER BY contact_id, created_at DESC
),
latest_meta AS (
    SELECT DISTINCT ON (contact_id) 
        contact_id,
        CASE WHEN toward_score > away_from_score THEN 'toward' WHEN away_from_score > toward_score THEN 'away_from' ELSE 'balanced' END as motivation_direction,
        CASE WHEN internal_score > external_score THEN 'internal' WHEN external_score > internal_score THEN 'external' ELSE 'balanced' END as reference_frame,
        CASE WHEN options_score > procedures_score THEN 'options' WHEN procedures_score > options_score THEN 'procedures' ELSE 'balanced' END as working_style,
        created_at
    FROM public.metaprogram_analysis
    ORDER BY contact_id, created_at DESC
)
SELECT 
    c.id as contact_id,
    c.first_name || ' ' || COALESCE(c.last_name, '') as full_name,
    v.visual_score,
    v.auditory_score,
    v.kinesthetic_score,
    v.digital_score,
    v.vak_dominant,
    m.motivation_direction,
    m.reference_frame,
    m.working_style
FROM 
    public.contacts c
LEFT JOIN latest_vak v ON c.id = v.contact_id
LEFT JOIN latest_meta m ON c.id = m.contact_id;

-- Function to search contacts with NLP filters
CREATE OR REPLACE FUNCTION public.search_contacts_by_nlp(
    p_user_id UUID,
    p_vak_primary TEXT DEFAULT NULL,
    p_metaprogram_motivation TEXT DEFAULT NULL,
    p_working_style TEXT DEFAULT NULL
)
RETURNS SETOF public.vw_contacts_nlp AS $$
BEGIN
    RETURN QUERY
    SELECT v.*
    FROM public.vw_contacts_nlp v
    JOIN public.contacts c ON c.id = v.contact_id
    WHERE 
        c.user_id = p_user_id
        AND (p_vak_primary IS NULL OR v.vak_dominant = p_vak_primary)
        AND (p_metaprogram_motivation IS NULL OR v.motivation_direction = p_metaprogram_motivation)
        AND (p_working_style IS NULL OR v.working_style = p_working_style);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
