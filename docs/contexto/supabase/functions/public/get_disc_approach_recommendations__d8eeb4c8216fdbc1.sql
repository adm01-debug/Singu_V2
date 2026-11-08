CREATE OR REPLACE FUNCTION public.get_disc_approach_recommendations(p_disc_type character varying, p_category character varying DEFAULT NULL::character varying, p_context character varying DEFAULT NULL::character varying)
 RETURNS TABLE(id uuid, category character varying, recommendation text, do_this text[], dont_do_this text[], power_words text[], trigger_words text[], priority integer, context character varying)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        dar.id,
        dar.category,
        dar.recommendation,
        dar.do_this,
        dar.dont_do_this,
        dar.power_words,
        dar.trigger_words,
        dar.priority,
        dar.context
    FROM disc_approach_recommendations dar
    WHERE dar.disc_type = p_disc_type
        AND dar.is_active = true
        AND (p_category IS NULL OR dar.category = p_category)
        AND (p_context IS NULL OR dar.context = p_context OR dar.context IS NULL)
    ORDER BY dar.priority ASC, dar.category;
END;
$function$
