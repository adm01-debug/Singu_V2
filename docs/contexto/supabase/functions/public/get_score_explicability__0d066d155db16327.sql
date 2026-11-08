CREATE OR REPLACE FUNCTION public.get_score_explicability(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_contact RECORD;
  v_interactions_count INTEGER;
  v_last_date TIMESTAMPTZ;
  v_avg_sentiment FLOAT;
  v_days_since_last INTEGER;
BEGIN
  SELECT relationship_score, relationship_stage INTO v_contact
    FROM public.contacts
   WHERE id = p_contact_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact not found';
  END IF;

  SELECT count(*), max(created_at),
         AVG(CASE WHEN sentiment = 'positive' THEN 100 WHEN sentiment = 'negative' THEN 0 ELSE 50 END)
    INTO v_interactions_count, v_last_date, v_avg_sentiment
    FROM public.interactions
   WHERE contact_id = p_contact_id AND user_id = auth.uid();

  v_days_since_last := EXTRACT(DAY FROM (now() - v_last_date));

  RETURN jsonb_build_object(
    'current_score', v_contact.relationship_score,
    'stage', v_contact.relationship_stage,
    'factors', jsonb_build_object(
      'volume', jsonb_build_object('value', v_interactions_count, 'impact', LEAST(v_interactions_count * 10, 100) * 0.4),
      'sentiment', jsonb_build_object('value', COALESCE(v_avg_sentiment, 50), 'impact', COALESCE(v_avg_sentiment, 50) * 0.3),
      'recency', jsonb_build_object('days', v_days_since_last, 'impact',
        CASE WHEN v_days_since_last <= 7 THEN 30 WHEN v_days_since_last <= 30 THEN 15 ELSE 0 END)
    )
  );
END;
$function$
