CREATE OR REPLACE FUNCTION public.get_reframe_suggestions(p_objection_text text, p_context character varying DEFAULT NULL::character varying, p_disc_type character varying DEFAULT NULL::character varying)
 RETURNS TABLE(pattern_id uuid, pattern_name character varying, pattern_code character varying, suggested_response text, effectiveness_score numeric, how_to_use text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    RETURN QUERY
    SELECT sop.id, sop.pattern_name, sop.pattern_code,
        COALESCE((SELECT soe.reframe_response FROM sleight_of_mouth_examples soe WHERE soe.pattern_id = sop.id AND (p_context IS NULL OR soe.context = p_context) ORDER BY soe.success_rate DESC NULLS LAST LIMIT 1), sop.example_response),
        sop.effectiveness_score, sop.when_to_use
    FROM sleight_of_mouth_patterns sop
    WHERE sop.is_active = true AND (p_context IS NULL OR p_context = ANY(sop.recommended_contexts)) AND (p_disc_type IS NULL OR p_disc_type = ANY(sop.disc_compatibility))
    ORDER BY sop.effectiveness_score DESC LIMIT 5;
END; $function$
