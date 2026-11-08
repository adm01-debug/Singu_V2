CREATE OR REPLACE FUNCTION public.suggest_triggers_for_contact(p_contact_id uuid, p_context character varying DEFAULT 'geral'::character varying)
 RETURNS TABLE(trigger_type_id uuid, trigger_name character varying, trigger_description text, effectiveness_score numeric, times_used integer, last_used timestamp with time zone, recommendation_reason text, example_application text, suggested_template_id uuid)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_disc_type VARCHAR(1);
BEGIN
    -- Usar primary_profile e is_current
    SELECT da.primary_profile INTO v_disc_type
    FROM disc_assessments da
    WHERE da.contact_id = p_contact_id 
    AND (da.is_current = true OR da.is_current IS NULL)
    ORDER BY da.created_at DESC
    LIMIT 1;
    
    RETURN QUERY
    WITH trigger_stats AS (
        SELECT 
            tul.trigger_type_id AS tid,
            COUNT(*) AS times_used,
            MAX(tul.used_at) AS last_used,
            AVG(CASE WHEN tul.was_effective THEN 100 ELSE 0 END) AS effectiveness
        FROM trigger_usage_log tul
        WHERE tul.contact_id = p_contact_id
        GROUP BY tul.trigger_type_id
    ),
    trigger_preferences AS (
        SELECT ctp.trigger_type_id AS tid, ctp.preference_score
        FROM contact_trigger_preferences ctp
        WHERE ctp.contact_id = p_contact_id
    )
    SELECT 
        tt.id,
        tt.name,
        tt.description,
        COALESCE(ts.effectiveness, tp.preference_score, 50.0)::DECIMAL(5,2),
        COALESCE(ts.times_used::INTEGER, 0),
        ts.last_used,
        CASE 
            WHEN ts.effectiveness > 70 THEN 'Alta efetividade com este contato'
            WHEN tp.preference_score > 70 THEN 'Preferência identificada'
            WHEN v_disc_type = 'D' AND tt.name IN ('Escassez', 'Urgência', 'Autoridade') THEN 'Recomendado para perfil D'
            WHEN v_disc_type = 'I' AND tt.name IN ('Prova Social', 'Afinidade', 'Storytelling') THEN 'Recomendado para perfil I'
            WHEN v_disc_type = 'S' AND tt.name IN ('Prova Social', 'Garantia', 'Compromisso') THEN 'Recomendado para perfil S'
            WHEN v_disc_type = 'C' AND tt.name IN ('Autoridade', 'Especificidade', 'Prova') THEN 'Recomendado para perfil C'
            ELSE 'Gatilho universal'
        END,
        tt.example_application,
        (SELECT trt.id FROM trigger_templates trt 
         WHERE trt.trigger_type_id = tt.id AND trt.is_active = true 
         ORDER BY trt.success_rate DESC LIMIT 1)
    FROM trigger_types tt
    LEFT JOIN trigger_stats ts ON tt.id = ts.tid
    LEFT JOIN trigger_preferences tp ON tt.id = tp.tid
    WHERE tt.is_active = true
    ORDER BY COALESCE(ts.effectiveness, tp.preference_score, 50.0) DESC, tt.name;
END;
$function$
