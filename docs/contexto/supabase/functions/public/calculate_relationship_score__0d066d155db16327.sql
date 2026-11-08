CREATE OR REPLACE FUNCTION public.calculate_relationship_score(p_contact_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_recency_score INTEGER := 0;
    v_frequency_score INTEGER := 0;
    v_sentiment_score INTEGER := 0;
    v_engagement_score INTEGER := 0;
    v_total_score INTEGER := 0;
    v_days_since_last INTEGER;
    v_interaction_count INTEGER;
    v_response_rate DECIMAL;
BEGIN
    -- Recência
    SELECT EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER INTO v_days_since_last
    FROM interactions WHERE contact_id = p_contact_id;
    
    v_recency_score := CASE
        WHEN v_days_since_last IS NULL THEN 0
        WHEN v_days_since_last <= 30 THEN 25
        WHEN v_days_since_last <= 60 THEN 15
        WHEN v_days_since_last <= 90 THEN 10
        ELSE 5
    END;
    
    -- Frequência
    SELECT COUNT(*) INTO v_interaction_count
    FROM interactions 
    WHERE contact_id = p_contact_id 
    AND created_at > NOW() - INTERVAL '90 days';
    
    v_frequency_score := LEAST(v_interaction_count * 3, 25);
    
    -- Sentimento
    SELECT CASE sentiment
        WHEN 'positive' THEN 25
        WHEN 'neutral' THEN 15
        ELSE 5
    END INTO v_sentiment_score
    FROM contacts WHERE id = p_contact_id;
    
    v_sentiment_score := COALESCE(v_sentiment_score, 15);
    
    -- Engajamento
    SELECT 
        COALESCE(
            (COUNT(*) FILTER (WHERE initiated_by = 'them')::DECIMAL / NULLIF(COUNT(*), 0) * 100)::INTEGER,
            0
        ) INTO v_response_rate
    FROM interactions 
    WHERE contact_id = p_contact_id 
    AND created_at > NOW() - INTERVAL '90 days';
    
    v_engagement_score := LEAST((v_response_rate / 4)::INTEGER, 25);
    
    -- Total
    v_total_score := v_recency_score + v_frequency_score + v_sentiment_score + v_engagement_score;
    
    UPDATE contacts SET relationship_score = v_total_score WHERE id = p_contact_id;
    
    RETURN v_total_score;
END;
$function$
