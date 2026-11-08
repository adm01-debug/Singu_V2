CREATE OR REPLACE FUNCTION public.calculate_relationship_metrics_internal(v_contact_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_score FLOAT := 0;
    v_sentiment TEXT := 'neutral';
    v_interactions_count INTEGER;
    v_last_date TIMESTAMP WITH TIME ZONE;
    v_avg_sentiment FLOAT;
    v_days_since_last INTEGER;
    v_stage TEXT;
    v_quality_score FLOAT := 0;
    v_interaction_record RECORD;
BEGIN
    -- [LOGICA IDENTICA A calculate_relationship_metrics ANTERIOR]
    SELECT count(*), max(created_at) INTO v_interactions_count, v_last_date
    FROM public.interactions WHERE contact_id = v_contact_id;
    v_days_since_last := EXTRACT(DAY FROM (now() - v_last_date));
    SELECT relationship_stage INTO v_stage FROM public.contacts WHERE id = v_contact_id;

    FOR v_interaction_record IN (
        SELECT type, content, transcription, duration, sentiment, created_at
        FROM public.interactions WHERE contact_id = v_contact_id
        ORDER BY created_at DESC LIMIT 10
    ) LOOP
        DECLARE v_this_weight FLOAT := 1.0;
        BEGIN
            IF v_interaction_record.type = 'meeting' THEN v_this_weight := 3.0;
            ELSIF v_interaction_record.type = 'call' THEN v_this_weight := 2.0;
            ELSE v_this_weight := 1.0; END IF;
            v_quality_score := v_quality_score + v_this_weight;
        END;
    END LOOP;

    SELECT AVG(CASE WHEN sentiment = 'positive' THEN 100 WHEN sentiment = 'negative' THEN 0 ELSE 50 END)
    INTO v_avg_sentiment FROM public.interactions WHERE contact_id = v_contact_id;

    v_score := LEAST(v_quality_score * 5, 40) + (COALESCE(v_avg_sentiment, 50) * 0.3);
    IF v_days_since_last <= 7 THEN v_score := v_score + 30;
    ELSIF v_days_since_last <= 30 THEN v_score := v_score + 15; END IF;

    UPDATE public.contacts
    SET relationship_score = ROUND(v_score), updated_at = now()
    WHERE id = v_contact_id;
END;
$function$
