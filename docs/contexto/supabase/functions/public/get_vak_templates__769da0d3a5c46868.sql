CREATE OR REPLACE FUNCTION public.get_vak_templates(p_contact_id uuid, p_template_type character varying DEFAULT NULL::character varying)
 RETURNS TABLE(template_id uuid, vak_type character varying, template_type character varying, title character varying, content text, sensory_words text[], recommended_media character varying[], formatting_tips text, match_score numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_visual DECIMAL;
    v_auditory DECIMAL;
    v_kinesthetic DECIMAL;
    v_dominant_vak VARCHAR(1);
BEGIN
    -- Usar nomes corretos: auditory_score, kinesthetic_score
    SELECT 
        vp.visual_score,
        vp.auditory_score,
        vp.kinesthetic_score,
        vp.primary_modality
    INTO v_visual, v_auditory, v_kinesthetic, v_dominant_vak
    FROM vak_profiles vp
    WHERE vp.contact_id = p_contact_id;
    
    -- Converter primary_modality para letra se necessário
    IF v_dominant_vak IS NOT NULL AND LENGTH(v_dominant_vak) > 1 THEN
        v_dominant_vak := CASE 
            WHEN v_dominant_vak ILIKE '%visual%' THEN 'V'
            WHEN v_dominant_vak ILIKE '%audit%' THEN 'A'
            WHEN v_dominant_vak ILIKE '%kines%' THEN 'K'
            ELSE UPPER(LEFT(v_dominant_vak, 1))
        END;
    END IF;
    
    IF v_dominant_vak IS NULL THEN
        RETURN QUERY
        SELECT 
            vt.id, vt.vak_type, vt.template_type, vt.title, vt.content,
            vt.sensory_words, vt.recommended_media, vt.formatting_tips,
            50.00::DECIMAL(5,2)
        FROM vak_templates vt
        WHERE vt.is_active = true
            AND (p_template_type IS NULL OR vt.template_type = p_template_type)
        ORDER BY vt.success_rate DESC;
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        vt.id, vt.vak_type, vt.template_type, vt.title, vt.content,
        vt.sensory_words, vt.recommended_media, vt.formatting_tips,
        CASE vt.vak_type
            WHEN 'V' THEN COALESCE(v_visual, 50)
            WHEN 'A' THEN COALESCE(v_auditory, 50)
            WHEN 'K' THEN COALESCE(v_kinesthetic, 50)
        END
    FROM vak_templates vt
    WHERE vt.is_active = true
        AND (p_template_type IS NULL OR vt.template_type = p_template_type)
    ORDER BY 
        CASE WHEN vt.vak_type = v_dominant_vak THEN 0 ELSE 1 END,
        vt.success_rate DESC;
END;
$function$
