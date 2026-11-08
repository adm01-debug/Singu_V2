CREATE OR REPLACE FUNCTION public.calculate_deal_velocity(p_contact_id uuid)
 RETURNS TABLE(contact_id uuid, avg_days_to_close numeric, current_deal_age integer, velocity_rating character varying, vs_team_avg numeric, bottleneck_stage character varying, recommended_actions text[])
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_avg_days DECIMAL(10,2) := 0;
    v_current_age INTEGER := 0;
    v_velocity VARCHAR(20);
    v_team_avg DECIMAL(10,2);
    v_bottleneck VARCHAR(100);
    v_vs_team DECIMAL(5,2);
    v_actions TEXT[] := ARRAY[]::TEXT[];
    v_first_interaction TIMESTAMPTZ;
    v_stage VARCHAR(100);
    v_company_id UUID;
    v_user_id UUID;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
    -- 1. Calcular idade do deal atual
    SELECT MIN(i.created_at), c.relationship_stage, c.company_id, c.user_id
    INTO v_first_interaction, v_stage, v_company_id, v_user_id
    FROM contacts c
    LEFT JOIN interactions i ON c.id = i.contact_id
    WHERE c.id = p_contact_id
    GROUP BY c.id, c.relationship_stage, c.company_id, c.user_id;
    
    v_current_age := COALESCE(EXTRACT(DAY FROM NOW() - v_first_interaction)::INTEGER, 0);
    
    -- 2. Calcular média do time
    SELECT AVG(EXTRACT(DAY FROM NOW() - first_int))
    INTO v_team_avg
    FROM (
        SELECT c.id, MIN(i.created_at) AS first_int
        FROM contacts c
        LEFT JOIN interactions i ON c.id = i.contact_id
        WHERE i.created_at IS NOT NULL
        GROUP BY c.id
    ) sub;
    
    v_team_avg := COALESCE(v_team_avg, 30);
    
    -- 3. Comparar com média do time
    v_vs_team := CASE 
        WHEN v_team_avg > 0 THEN ((v_current_age - v_team_avg) / v_team_avg * 100)
        ELSE 0
    END;
    
    -- 4. Determinar velocity rating
    v_velocity := CASE 
        WHEN v_current_age <= v_team_avg * 0.7 THEN 'fast'
        WHEN v_current_age <= v_team_avg * 1.3 THEN 'normal'
        WHEN v_current_age <= v_team_avg * 2.0 THEN 'slow'
        ELSE 'stalled'
    END;
    
    -- 5. Identificar gargalo
    IF v_velocity IN ('slow', 'stalled') THEN
        v_bottleneck := COALESCE(v_stage, 'unknown');
    END IF;
    
    -- 6. Recomendações
    IF v_velocity = 'stalled' THEN
        v_actions := ARRAY[
            'Deal parado: Verificar objeções não resolvidas',
            'Agendar reunião de alinhamento',
            'Considerar oferta especial'
        ];
    ELSIF v_velocity = 'slow' THEN
        v_actions := ARRAY[
            'Deal lento: Identificar bloqueio',
            'Aumentar frequência de follow-ups'
        ];
    ELSE
        v_actions := ARRAY['Deal no ritmo esperado'];
    END IF;
    
    -- 7. Salvar análise (QUALIFICANDO nome da tabela)
    DELETE FROM deal_velocity_analysis 
    WHERE deal_velocity_analysis.contact_id = p_contact_id;
    
    INSERT INTO deal_velocity_analysis (
        contact_id, company_id, user_id, avg_days_to_close, current_deal_age,
        velocity_rating, vs_team_avg, bottleneck_stage, recommended_actions
    )
    VALUES (
        p_contact_id, v_company_id, v_user_id, v_team_avg, v_current_age,
        v_velocity, v_vs_team, v_bottleneck, v_actions
    );
    
    RETURN QUERY SELECT 
        p_contact_id,
        v_team_avg,
        v_current_age,
        v_velocity,
        v_vs_team,
        v_bottleneck,
        v_actions;
END;
$function$
